'use client';

import { useState, useCallback, useMemo } from 'react';
import { Download, Trash2, LogOut } from 'lucide-react';
import { Card, Button, Input, showToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface AccountDataSectionProps {
  profile: Profile | null;
}

const DELETE_CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

export function AccountDataSection({ profile }: AccountDataSectionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  const supabase = useMemo(() => createClient(), []);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, [supabase]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmation.trim().toUpperCase() !== DELETE_CONFIRMATION_TEXT) {
      setError(`Type "${DELETE_CONFIRMATION_TEXT}" to confirm.`);
      return;
    }

    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      if (res.ok) {
        await supabase.auth.signOut();
        window.location.href = '/login';
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not delete account. Try again?');
        setDeleting(false);
      }
    } catch {
      setError('Network error. Please check your connection.');
      setDeleting(false);
    }
  }, [deleteConfirmation, supabase]);

  const handleExport = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast({ message: 'You must be signed in to export data.', variant: 'error' });
        return;
      }

      const [tasks, habits, sessions, checkIns, achievements] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id),
        supabase.from('check_ins').select('*').eq('user_id', user.id),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        profile: profile ?? null,
        tasks: tasks.data ?? [],
        habits: habits.data ?? [],
        focusSessions: sessions.data ?? [],
        checkIns: checkIns.data ?? [],
        achievements: achievements.data ?? [],
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neuroflow-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({ message: 'Data exported!', variant: 'success' });
    } catch {
      showToast({ message: 'Failed to export data.', variant: 'error' });
    }
  }, [supabase, profile]);

  return (
    <>
      <Card header={<h2 className="text-sm font-semibold text-text-primary">Account</h2>}>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" icon={<LogOut size={16} />} loading={signingOut} onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </Card>

      <Card header={<h2 className="text-sm font-semibold text-text-primary">Data</h2>}>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport}>
            Export data
          </Button>
          {!showDeleteConfirm ? (
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setShowDeleteConfirm(true)}>
              Delete account
            </Button>
          ) : (
            <div className="p-4 rounded-xl border border-accent-spark/20 bg-accent-spark/5">
              <p className="text-sm text-text-primary mb-1">Are you sure?</p>
              <p className="text-xs text-text-muted mb-3">This will permanently delete your account and all data. This cannot be undone.</p>
              <p className="text-xs text-text-muted mb-2">
                Type <span className="font-mono text-text-primary">{DELETE_CONFIRMATION_TEXT}</span> to confirm.
              </p>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={DELETE_CONFIRMATION_TEXT}
                autoComplete="off"
                className="mb-3"
              />
              {error && <p className="text-xs text-accent-spark mb-2">{error}</p>}
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleting}
                  disabled={deleteConfirmation.trim().toUpperCase() !== DELETE_CONFIRMATION_TEXT}
                  onClick={handleDeleteAccount}
                >
                  Yes, delete my account
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation('');
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
