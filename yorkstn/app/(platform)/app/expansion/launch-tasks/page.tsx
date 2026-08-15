'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface LaunchTask {
  id: string
  title: string
  status: string
  dueAt: string | null
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'done', 'blocked'] as const
const STATUS_COLORS: Record<string, string> = {
  todo: 'tw-bg-gray-100 tw-text-gray-600',
  in_progress: 'tw-bg-blue-100 tw-text-blue-700',
  done: 'tw-bg-green-100 tw-text-green-700',
  blocked: 'tw-bg-red-100 tw-text-red-700',
}

// US-45 — Launch Tasks tracker.
export default function LaunchTasksPage() {
  const [tasks, setTasks] = useState<LaunchTask[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/expansion/launch-tasks')
    const body = await res.json()
    setTasks(body.data ?? [])
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/v1/expansion/launch-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      }),
    })
    setTitle('')
    setDueAt('')
    await load()
    setSubmitting(false)
  }

  async function handleStatusChange(taskId: string, status: string) {
    await fetch(`/api/v1/expansion/launch-tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  return (
    <AppShell>
      <Link href="/app/expansion" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Expansion
      </Link>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Launch Tasks</h1>

      <form onSubmit={handleCreate} className="tw-mb-6 tw-flex tw-max-w-xl tw-items-end tw-gap-2">
        <label className="tw-flex tw-flex-1 tw-flex-col tw-gap-1 tw-text-xs">
          Task
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
          />
        </label>
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-xs">
          Due date
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-text-white disabled:tw-opacity-50"
        >
          Add task
        </button>
      </form>

      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No launch tasks yet.</p>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="tw-flex tw-items-center tw-justify-between tw-rounded tw-border tw-border-gray-200 tw-p-3"
            >
              <div>
                <div className="tw-text-sm">{task.title}</div>
                {task.dueAt && (
                  <div className="tw-text-xs tw-text-gray-400">Due {new Date(task.dueAt).toLocaleDateString()}</div>
                )}
              </div>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                className={`tw-rounded tw-border-none tw-px-2 tw-py-1 tw-text-xs ${STATUS_COLORS[task.status] ?? STATUS_COLORS.todo}`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
