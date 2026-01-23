/**
 * Share Modal Component
 * Contract: PERMISSION_DESIGN_SHARE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, UserPlus, Trash2 } from "lucide-react";
import { Namespace, Relation } from "@/lib/permissions/types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  namespace: Namespace;
  resourceTitle?: string;
}

interface SharedUser {
  userId: string;
  email?: string;
  name?: string;
  relation: Relation;
}

export function ShareModal({
  isOpen,
  onClose,
  resourceId,
  namespace,
  resourceTitle,
}: ShareModalProps) {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<Relation>("viewer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSharedUsers();
    }
  }, [isOpen, resourceId]);

  const fetchSharedUsers = async () => {
    try {
      const response = await fetch(
        `/api/permissions/list?namespace=${namespace}&objectId=${resourceId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSharedUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch shared users:", error);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/permissions/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace,
          objectId: resourceId,
          email,
          relation,
        }),
      });

      if (response.ok) {
        setEmail("");
        fetchSharedUsers();
      } else {
        const data = await response.json();
        setError(data.error || "공유에 실패했습니다");
      }
    } catch (error) {
      setError("공유에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      const response = await fetch("/api/permissions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace,
          objectId: resourceId,
          subjectId: userId,
        }),
      });

      if (response.ok) {
        fetchSharedUsers();
      }
    } catch (error) {
      console.error("Failed to revoke permission:", error);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/shared/${namespace}/${resourceId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl dark:shadow-zinc-900/50 w-full max-w-md mx-4 p-6 border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {resourceTitle ? `"${resourceTitle}" 공유` : "공유"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors touch-target"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Share Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            공유 링크
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${namespace}/${resourceId}`}
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400"
            />
            <button
              onClick={copyLink}
              className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors touch-target"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              )}
            </button>
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleShare} className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            사용자 초대
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              required
            />
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value as Relation)}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="viewer">보기</option>
              <option value="editor">편집</option>
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors touch-target"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </form>

        {/* Shared Users List */}
        {sharedUsers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              공유된 사용자
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sharedUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {(user.name || user.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {user.name || user.email || user.userId}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                        {user.relation === "owner"
                          ? "소유자"
                          : user.relation === "editor"
                          ? "편집자"
                          : "뷰어"}
                      </p>
                    </div>
                  </div>
                  {user.relation !== "owner" && (
                    <button
                      onClick={() => handleRevoke(user.userId)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors touch-target"
                    >
                      <Trash2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
