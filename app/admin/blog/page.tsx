// Path: app/admin/blog/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Trash2, Eye, CheckCircle, XCircle, Clock, Globe } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  keyword: string;
  status: 'draft' | 'published' | 'rejected';
  created_at: string;
  published_at: string | null;
  reading_time_mins: number;
}

const STATUS_COLOURS: Record<string, string> = {
  draft: 'bg-yellow-900 text-yellow-300',
  published: 'bg-green-900 text-green-300',
  rejected: 'bg-red-900 text-red-300',
};

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [preview, setPreview] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  async function fetchPosts() {
    setLoading(true);
    const res = await fetch(`/api/admin/blog?status=${filter}`, { cache: 'no-store' });
    if (res.status === 401) { router.push('/admin'); return; }
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  }

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/blog/generate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Draft created: "${data.title}"\nKeyword: ${data.keyword}\nApproval email sent.`);
        fetchPosts();
      } else {
        alert('Generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error');
    }
    setGenerating(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/admin/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchPosts();
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
    fetchPosts();
  }

  async function openPreview(slug: string) {
    const res = await fetch(`/api/blog/post/${slug}`);
    const data = await res.json();
    setPreviewContent(data.content || '');
    setPreview(slug);
  }

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/orders" className="text-gray-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Blog Manager</h1>
            <p className="text-sm text-gray-400 mt-0.5">Generate, review, and publish SEO articles</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition"
            >
              <Sparkles size={16} />
              {generating ? 'Generating...' : 'Generate New Article'}
            </button>
          </div>
        </div>

        {generating && (
          <div className="bg-orange-950 border border-orange-800 rounded-xl p-4 mb-6 text-sm text-orange-300">
            Claude is writing your article... this takes about 15 seconds.
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'draft', 'published', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                filter === s
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500 self-center">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No articles yet. Click &quot;Generate New Article&quot; to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((post) => (
              <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLOURS[post.status]}`}>
                        {post.status}
                      </span>
                      {post.keyword && (
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                          {post.keyword}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-base leading-snug mb-1">{post.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{post.excerpt}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {post.reading_time_mins ? ` - ${post.reading_time_mins} min read` : ''}
                      {post.published_at ? ` - Published ${new Date(post.published_at).toLocaleDateString('en-GB')}` : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {post.status === 'published' && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-400 transition"
                        title="View live"
                      >
                        <Globe size={16} />
                      </a>
                    )}
                    {post.status === 'draft' && (
                      <>
                        <button
                          onClick={() => updateStatus(post.id, 'published')}
                          className="flex items-center gap-1 text-xs bg-green-900 hover:bg-green-800 text-green-300 px-3 py-1.5 rounded-lg transition"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus(post.id, 'rejected')}
                          className="flex items-center gap-1 text-xs bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1.5 rounded-lg transition"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                    {post.status === 'rejected' && (
                      <button
                        onClick={() => updateStatus(post.id, 'draft')}
                        className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
                      >
                        <Clock size={13} /> Restore
                      </button>
                    )}
                    <button
                      onClick={() => deletePost(post.id, post.title)}
                      className="p-2 text-gray-600 hover:text-red-400 transition"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm text-gray-400">
          <p className="font-medium text-gray-300 mb-1">How it works</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Click &quot;Generate New Article&quot; - Claude writes a 1,500-word SEO article targeting the next keyword in the list</li>
            <li>You receive an email with the draft and Approve / Reject buttons</li>
            <li>Approve publishes immediately - the article appears on the live blog</li>
            <li>A new article is also auto-generated every Monday via the daily cron</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
