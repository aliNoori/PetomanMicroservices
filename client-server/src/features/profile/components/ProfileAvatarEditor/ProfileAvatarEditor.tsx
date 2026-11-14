
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common";
import { authService, useAuth } from "@/features/auth";
import { UserAvatar } from "../UserAvatar/UserAvatar";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function ProfileAvatarEditor() {
  const { user, refreshUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  if (!user) {
    return null;
  }

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    setError(null);
    setSuccess(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.uploadAvatar(selectedFile);

      await refreshUser();

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccess("Your profile picture has been updated.");
    } catch {
      setError("Failed to update your profile picture. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayedAvatarUrl = previewUrl ?? user.avatarUrl;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div className="flex items-center gap-4">
        <UserAvatar
          avatarUrl={displayedAvatarUrl}
          fallback={
            user.firstName?.charAt(0) ||
            user.email?.charAt(0) ||
            "U"
          }
          size="lg"
          className="ring-2 ring-border"
        />

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">
            Profile picture
          </h2>

          <p className="mt-1 text-sm text-text-secondary">
            Choose a JPEG, PNG, or WebP image up to 5 MB.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="block w-full text-sm text-text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-medium file:text-primary hover:file:cursor-pointer"
        aria-label="Choose profile picture"
      />

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-success">
          {success}
        </p>
      )}

      {selectedFile && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={loading}
          >
            Save picture
          </Button>

          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      )}
    </section>
  );
}
