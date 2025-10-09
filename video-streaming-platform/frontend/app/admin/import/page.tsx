'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { adminImportAPI } from '@/lib/admin-api';

export default function ImportVideos() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Options
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [markFeatured, setMarkFeatured] = useState(false);

  // Auth check
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access the admin panel</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Go to Home & Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setPreview(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJsonInput(text);
      await validateAndPreview(parsed);
    } catch (err: any) {
      setError(`Failed to parse JSON file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJsonInput = async () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON data');
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);
    setImportResult(null);

    try {
      const parsed = JSON.parse(jsonInput);
      await validateAndPreview(parsed);
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateAndPreview = async (library: any) => {
    try {
      const validation = await adminImportAPI.validateLibrary(library);

      if (!validation.valid) {
        setError(validation.error || 'Invalid library format');
        return;
      }

      setPreview({
        videoCount: validation.videoCount,
        sample: validation.sample,
      });
    } catch (err: any) {
      setError(`Validation failed: ${err.message}`);
    }
  };

  const handleImport = async () => {
    if (!preview) {
      setError('Please validate the library first');
      return;
    }

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const library = JSON.parse(jsonInput);
      const result = await adminImportAPI.importVideos(library, {
        skipDuplicates,
        autoPublish,
        markFeatured,
      });

      setImportResult(result);
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setJsonInput('');
    setPreview(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import Videos</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Import videos from library.json format
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {!preview && !importResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Library Data</h2>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload library.json File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                disabled={loading}
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">OR</span>
              </div>
            </div>

            {/* JSON Paste */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste JSON Data
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"version": "1.0", "videos": [...]}'
                className="w-full h-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleJsonInput}
              disabled={loading || !jsonInput.trim()}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validating...' : 'Validate & Preview'}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-red-600 dark:text-red-400 text-xl mr-3">⚠️</div>
              <div className="flex-1">
                <h3 className="text-red-800 dark:text-red-300 font-semibold mb-1">Error</h3>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {preview && !importResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Import Preview</h2>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p className="text-green-800 dark:text-green-300 font-semibold">
                ✓ Valid library.json format
              </p>
              <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                Found {preview.videoCount} videos ready to import
              </p>
            </div>

            {/* Options */}
            <div className="mb-6 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Import Options</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Skip duplicate videos (recommended)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-publish videos</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={markFeatured}
                  onChange={(e) => setMarkFeatured(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mark all as featured</span>
              </label>
            </div>

            {/* Sample Videos */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Preview (First 5 videos)</h3>
              <div className="space-y-2">
                {preview.sample?.slice(0, 5).map((video: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{video.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Author: {video.author} · Duration: {video.duration}s · Quality: {video.quality}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : `Import ${preview.videoCount} Videos`}
              </button>
              <button
                onClick={handleReset}
                disabled={importing}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Import Results</h2>

            {importResult.success ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-green-800 dark:text-green-300 font-semibold text-lg">
                  ✓ Import completed successfully!
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 dark:text-yellow-300 font-semibold">
                  ⚠️ Import completed with errors
                </p>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{importResult.total}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Imported</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.imported}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Skipped</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.skipped}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.errors.length}</p>
              </div>
            </div>

            {/* New Entities */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-400">New Authors</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{importResult.stats.new_authors}</p>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                <p className="text-sm text-pink-600 dark:text-pink-400">New Actors</p>
                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{importResult.stats.new_actors}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <p className="text-sm text-orange-600 dark:text-orange-400">New Tags</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{importResult.stats.new_tags}</p>
              </div>
            </div>

            {/* Errors List */}
            {importResult.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Errors ({importResult.errors.length})</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importResult.errors.map((error: any, index: number) => (
                    <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
                      <p className="font-medium text-red-800 dark:text-red-300">{error.title}</p>
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/videos')}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                View Imported Videos
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Import More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
