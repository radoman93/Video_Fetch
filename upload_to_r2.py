#!/usr/bin/env python3
"""
Cloudflare R2 Upload Script for Porn_Fetch Library
Uploads all videos from library.json to Cloudflare R2 and updates library with cloudflare_url
"""

import json
import os
import sys
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from datetime import datetime


class R2Uploader:
    def __init__(self, account_id, access_key_id, secret_access_key, bucket_name, max_workers=4, custom_domain=None):
        """
        Initialize R2 uploader with credentials

        Args:
            account_id: Cloudflare account ID
            access_key_id: R2 access key ID
            secret_access_key: R2 secret access key
            bucket_name: R2 bucket name
            max_workers: Number of concurrent upload threads
            custom_domain: Optional custom domain for public URLs
        """
        self.bucket_name = bucket_name
        self.max_workers = max_workers

        # Configure S3 client for R2
        self.s3_client = boto3.client(
            's3',
            endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(signature_version='s3v4')
        )

        # Public R2 domain (use custom domain if provided)
        if custom_domain:
            self.public_url_base = f'https://{custom_domain}'
        else:
            self.public_url_base = f'https://pub-{account_id}.r2.dev'

    def object_exists(self, object_key):
        """
        Check if an object already exists in R2

        Args:
            object_key: S3 object key to check

        Returns:
            bool: True if object exists, False otherwise
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=object_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise

    def upload_file(self, file_path, object_key, check_exists=True):
        """
        Upload a single file to R2

        Args:
            file_path: Local file path
            object_key: S3 object key (path in bucket)
            check_exists: Check if object already exists on R2

        Returns:
            tuple: (success: bool, cloudflare_url: str, error: str, already_exists: bool)
        """
        try:
            file_path = Path(file_path)

            # Check if file exists locally
            if not file_path.exists():
                return False, None, f"File not found: {file_path}", False

            # Check if already exists on R2
            if check_exists and self.object_exists(object_key):
                cloudflare_url = f"{self.public_url_base}/{object_key}"
                return True, cloudflare_url, None, True

            # Upload file
            self.s3_client.upload_file(
                str(file_path),
                self.bucket_name,
                object_key,
                ExtraArgs={'ContentType': 'video/mp4'}
            )

            # Generate public URL
            cloudflare_url = f"{self.public_url_base}/{object_key}"

            return True, cloudflare_url, None, False

        except ClientError as e:
            return False, None, f"Upload error: {str(e)}", False
        except Exception as e:
            return False, None, f"Unexpected error: {str(e)}", False

    def process_library(self, library_path, output_library_path=None, skip_existing=True, check_r2_exists=True):
        """
        Process entire library and upload videos to R2

        Args:
            library_path: Path to library.json
            output_library_path: Path to save updated library (defaults to library_path)
            skip_existing: Skip videos that already have cloudflare_url in library
            check_r2_exists: Check if files already exist on R2 before uploading

        Returns:
            dict: Statistics about the upload process
        """
        # Load library
        with open(library_path, 'r', encoding='utf-8') as f:
            library = json.load(f)

        if output_library_path is None:
            output_library_path = library_path

        # Get library directory for resolving relative paths
        library_dir = Path(library_path).parent.resolve()

        videos = library.get('videos', [])
        total_videos = len(videos)

        print(f"Found {total_videos} videos in library")
        print(f"Using {self.max_workers} upload threads")
        print(f"Bucket: {self.bucket_name}")
        print(f"Library directory: {library_dir}")
        print("-" * 60)

        # Track statistics
        stats = {
            'total': total_videos,
            'skipped': 0,
            'already_on_r2': 0,
            'successful': 0,
            'failed': 0,
            'errors': []
        }

        # Prepare upload tasks
        upload_tasks = []
        for idx, video in enumerate(videos):
            # Skip if already uploaded
            if skip_existing and video.get('cloudflare_url'):
                stats['skipped'] += 1
                print(f"[{idx+1}/{total_videos}] ⏭️  Skipping (already in library): {video.get('title', 'Unknown')}")
                continue

            file_path = video.get('file_path')
            if not file_path:
                stats['failed'] += 1
                stats['errors'].append({
                    'video': video.get('title', 'Unknown'),
                    'error': 'No file_path in library entry'
                })
                print(f"[{idx+1}/{total_videos}] ❌ No file_path: {video.get('title', 'Unknown')}")
                continue

            # Resolve file path (handle relative paths)
            file_path_obj = Path(file_path)
            if not file_path_obj.is_absolute():
                file_path_obj = (library_dir / file_path_obj).resolve()

            # Generate object key (just filename, no prefix)
            filename = file_path_obj.name
            object_key = filename

            upload_tasks.append({
                'video': video,
                'video_idx': idx,
                'file_path': str(file_path_obj),
                'object_key': object_key,
                'task_number': idx + 1
            })

        # Upload with thread pool
        if upload_tasks:
            print(f"\nStarting upload of {len(upload_tasks)} videos...\n")

            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # Submit all upload tasks
                future_to_task = {
                    executor.submit(
                        self.upload_file,
                        task['file_path'],
                        task['object_key'],
                        check_r2_exists
                    ): task
                    for task in upload_tasks
                }

                # Process completed uploads
                for future in as_completed(future_to_task):
                    task = future_to_task[future]
                    video = task['video']
                    video_idx = task['video_idx']
                    task_num = task['task_number']

                    try:
                        success, cloudflare_url, error, already_exists = future.result()

                        if success:
                            # Update video with cloudflare_url
                            videos[video_idx]['cloudflare_url'] = cloudflare_url
                            if already_exists:
                                stats['already_on_r2'] += 1
                                print(f"[{task_num}/{total_videos}] ♻️  Already on R2: {video.get('title', 'Unknown')}")
                                print(f"                URL: {cloudflare_url}")
                            else:
                                stats['successful'] += 1
                                print(f"[{task_num}/{total_videos}] ✅ Uploaded: {video.get('title', 'Unknown')}")
                                print(f"                URL: {cloudflare_url}")
                        else:
                            stats['failed'] += 1
                            stats['errors'].append({
                                'video': video.get('title', 'Unknown'),
                                'error': error
                            })
                            print(f"[{task_num}/{total_videos}] ❌ Failed: {video.get('title', 'Unknown')}")
                            print(f"                Error: {error}")

                    except Exception as e:
                        stats['failed'] += 1
                        stats['errors'].append({
                            'video': video.get('title', 'Unknown'),
                            'error': str(e)
                        })
                        print(f"[{task_num}/{total_videos}] ❌ Exception: {video.get('title', 'Unknown')}")
                        print(f"                Error: {str(e)}")

        # Save updated library
        library['videos'] = videos
        library['last_r2_sync'] = datetime.now().isoformat()

        with open(output_library_path, 'w', encoding='utf-8') as f:
            json.dump(library, f, indent=2, ensure_ascii=False)

        print("\n" + "=" * 60)
        print("UPLOAD SUMMARY")
        print("=" * 60)
        print(f"Total videos:        {stats['total']}")
        print(f"Skipped (in lib):    {stats['skipped']}")
        print(f"Already on R2:       {stats['already_on_r2']}")
        print(f"Newly uploaded:      {stats['successful']}")
        print(f"Failed:              {stats['failed']}")
        print(f"Library updated:     {output_library_path}")

        if stats['errors']:
            print("\nERRORS:")
            for err in stats['errors']:
                print(f"  - {err['video']}: {err['error']}")

        return stats


def main():
    parser = argparse.ArgumentParser(
        description='Upload Porn_Fetch library videos to Cloudflare R2',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic upload with 4 threads (default)
  python upload_to_r2.py --account-id ABC123 --access-key XXX --secret-key YYY --bucket my-bucket

  # Upload with 8 threads
  python upload_to_r2.py --account-id ABC123 --access-key XXX --secret-key YYY --bucket my-bucket --threads 8

  # Upload with custom domain
  python upload_to_r2.py --account-id ABC123 --access-key XXX --secret-key YYY --bucket my-bucket --custom-domain cdn.example.com

  # Upload to different output library
  python upload_to_r2.py --account-id ABC123 --access-key XXX --secret-key YYY --bucket my-bucket --output library_backup.json

  # Re-upload everything (ignore existing cloudflare_url in library)
  python upload_to_r2.py --account-id ABC123 --access-key XXX --secret-key YYY --bucket my-bucket --force

  # Skip R2 existence check for faster uploads (may create duplicates)
  python upload_to_r2.py --account-id ABC123 --access-key XXX --secret-key YYY --bucket my-bucket --no-check-r2
        """
    )

    # R2 credentials
    parser.add_argument('--account-id', required=True,
                        help='Cloudflare account ID')
    parser.add_argument('--access-key', required=True,
                        help='R2 access key ID')
    parser.add_argument('--secret-key', required=True,
                        help='R2 secret access key')
    parser.add_argument('--bucket', required=True,
                        help='R2 bucket name')

    # File paths
    parser.add_argument('--library', default='library.json',
                        help='Path to library.json (default: library.json)')
    parser.add_argument('--output', default=None,
                        help='Path to save updated library (default: overwrite library.json)')

    # Options
    parser.add_argument('--threads', type=int, default=4,
                        help='Number of concurrent upload threads (default: 4)')
    parser.add_argument('--force', action='store_true',
                        help='Re-upload videos even if cloudflare_url exists in library')
    parser.add_argument('--custom-domain', default=None,
                        help='Custom R2 public domain (e.g., cdn.example.com)')
    parser.add_argument('--no-check-r2', action='store_true',
                        help='Skip checking if files already exist on R2 (faster but may duplicate)')

    args = parser.parse_args()

    # Validate library file
    if not os.path.exists(args.library):
        print(f"Error: Library file not found: {args.library}")
        sys.exit(1)

    # Create uploader
    uploader = R2Uploader(
        account_id=args.account_id,
        access_key_id=args.access_key,
        secret_access_key=args.secret_key,
        bucket_name=args.bucket,
        max_workers=args.threads,
        custom_domain=args.custom_domain
    )

    # Process library
    try:
        stats = uploader.process_library(
            library_path=args.library,
            output_library_path=args.output,
            skip_existing=not args.force,
            check_r2_exists=not args.no_check_r2
        )

        # Exit with error code if any uploads failed
        if stats['failed'] > 0:
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\nUpload interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
