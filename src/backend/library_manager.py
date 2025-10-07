"""
Library Manager for Porn Fetch
Manages a JSON library to track downloaded videos and prevent duplicates
"""

import json
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from base_api.base import setup_logger

logger = setup_logger(name="Porn Fetch - [Library Manager]", log_file="PornFetch.log", level=logging.DEBUG)


class LibraryManager:
    """Manages the video library JSON file for tracking downloads"""

    def __init__(self, library_path: str = None):
        """
        Initialize the library manager

        Args:
            library_path: Path to library.json file. If None, uses current directory
        """
        if library_path:
            self.library_path = library_path
        else:
            self.library_path = os.path.join(os.getcwd(), "library.json")

        self.library_data = self.load_library()

    def load_library(self) -> Dict[str, Any]:
        """
        Load the library from JSON file or create new if doesn't exist

        Returns:
            Dictionary containing library data
        """
        if os.path.exists(self.library_path):
            try:
                with open(self.library_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    logger.debug(f"Loaded library with {len(data.get('videos', []))} videos")
                    return data
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Error loading library: {e}")
                return self._create_empty_library()
        else:
            logger.debug("Library file doesn't exist, creating new one")
            return self._create_empty_library()

    def _create_empty_library(self) -> Dict[str, Any]:
        """
        Create an empty library structure

        Returns:
            Empty library dictionary
        """
        return {
            "version": "1.0",
            "videos": []
        }

    def save_library(self) -> bool:
        """
        Save the library to JSON file

        Returns:
            True if successful, False otherwise
        """
        try:
            with open(self.library_path, 'w', encoding='utf-8') as f:
                json.dump(self.library_data, f, indent=2, ensure_ascii=False)
            logger.debug(f"Saved library with {len(self.library_data['videos'])} videos")
            return True
        except IOError as e:
            logger.error(f"Error saving library: {e}")
            return False

    def check_duplicate(self, url: str = None, video_id: str = None, title: str = None) -> Optional[Dict]:
        """
        Check if a video already exists in the library

        Args:
            url: Video URL to check
            video_id: Video ID to check
            title: Video title to check (less reliable)

        Returns:
            Video entry if duplicate found, None otherwise
        """
        for video in self.library_data.get("videos", []):
            # Check by URL (most reliable)
            if url and video.get("url") == url:
                logger.debug(f"Found duplicate by URL: {url}")
                return video

            # Check by video ID
            if video_id and video.get("video_id") == video_id:
                logger.debug(f"Found duplicate by ID: {video_id}")
                return video

            # Check by exact title match (least reliable, optional)
            if title and video.get("title") == title:
                logger.debug(f"Found potential duplicate by title: {title}")
                # Return video but caller should confirm this is actually a duplicate
                return video

        return None

    def add_video_entry(self,
                       url: str,
                       video_id: str,
                       title: str,
                       author: str = None,
                       duration: int = None,  # in seconds
                       tags: List[str] = None,
                       actors: List[str] = None,
                       file_path: str = None,
                       thumbnail: str = None,
                       publish_date: str = None,
                       quality: str = None) -> bool:
        """
        Add a new video entry to the library

        Args:
            url: Video URL
            video_id: Unique video identifier
            title: Video title
            author: Video author/channel
            duration: Video duration in seconds
            tags: List of tags
            actors: List of actors/performers
            file_path: Path where video was saved
            thumbnail: Thumbnail URL
            publish_date: Video publish date
            quality: Video quality (e.g., "720", "1080", "best", "worst")

        Returns:
            True if added successfully, False otherwise
        """
        # Check for duplicates first
        if self.check_duplicate(url=url, video_id=video_id):
            logger.warning(f"Video already exists in library: {title}")
            return False

        # Create video entry
        video_entry = {
            "url": url,
            "video_id": video_id,
            "title": title,
            "author": author or "Unknown",
            "duration": duration,  # stored in seconds
            "quality": quality,  # video quality (720, 1080, etc.)
            "tags": tags or [],
            "actors": actors or [],
            "download_date": datetime.now().isoformat(),
            "file_path": file_path,
            "thumbnail": thumbnail,
            "publish_date": publish_date
        }

        # Add to library
        self.library_data["videos"].append(video_entry)
        logger.debug(f"Added video to library: {title}")

        # Auto-save
        return self.save_library()

    def remove_video_entry(self, video_id: str) -> bool:
        """
        Remove a video entry from the library

        Args:
            video_id: ID of video to remove

        Returns:
            True if removed, False if not found
        """
        videos = self.library_data.get("videos", [])
        for i, video in enumerate(videos):
            if video.get("video_id") == video_id:
                del videos[i]
                self.save_library()
                logger.debug(f"Removed video from library: {video_id}")
                return True
        return False

    def get_all_videos(self) -> List[Dict]:
        """
        Get all videos in the library

        Returns:
            List of all video entries
        """
        return self.library_data.get("videos", [])

    def get_video_by_id(self, video_id: str) -> Optional[Dict]:
        """
        Get a specific video by ID

        Args:
            video_id: Video ID to search for

        Returns:
            Video entry if found, None otherwise
        """
        for video in self.library_data.get("videos", []):
            if video.get("video_id") == video_id:
                return video
        return None

    def get_library_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the library

        Returns:
            Dictionary with library statistics
        """
        videos = self.library_data.get("videos", [])
        total_duration = sum(v.get("duration", 0) for v in videos if v.get("duration"))

        return {
            "total_videos": len(videos),
            "total_duration_seconds": total_duration,
            "total_duration_hours": round(total_duration / 3600, 2) if total_duration else 0,
            "unique_authors": len(set(v.get("author") for v in videos if v.get("author"))),
            "library_path": self.library_path
        }

    def clear_library(self) -> bool:
        """
        Clear all entries from the library

        Returns:
            True if cleared successfully
        """
        self.library_data = self._create_empty_library()
        return self.save_library()

    def search_videos(self, query: str) -> List[Dict]:
        """
        Search videos in library by title, author, or tags

        Args:
            query: Search query string

        Returns:
            List of matching video entries
        """
        query_lower = query.lower()
        results = []

        for video in self.library_data.get("videos", []):
            # Check title
            if query_lower in video.get("title", "").lower():
                results.append(video)
                continue

            # Check author
            if query_lower in video.get("author", "").lower():
                results.append(video)
                continue

            # Check tags
            for tag in video.get("tags", []):
                if query_lower in tag.lower():
                    results.append(video)
                    break

            # Check actors
            for actor in video.get("actors", []):
                if query_lower in actor.lower():
                    results.append(video)
                    break

        return results


# Global instance for easy access
_library_instance = None

def get_library_manager(library_path: str = None) -> LibraryManager:
    """
    Get or create a global LibraryManager instance

    Args:
        library_path: Path to library file

    Returns:
        LibraryManager instance
    """
    global _library_instance
    if _library_instance is None:
        _library_instance = LibraryManager(library_path)
    return _library_instance