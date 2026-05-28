import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, Edit3, Trash2, Eye, CheckCircle, XCircle, LayoutDashboard, Globe, Calendar } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { apiClient } from "../../utils/apiClient";
import { cn } from "../../utils/cn";

export function BlogModule() {
 const [posts, setPosts] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [isEditorOpen, setIsEditorOpen] = useState(false);
 const [editingPost, setEditingPost] = useState<any | null>(null);

 // Form State
 const [title, setTitle] = useState("");
 const [content, setContent] = useState("");
 const [excerpt, setExcerpt] = useState("");
 const [coverImage, setCoverImage] = useState("");
 const [published, setPublished] = useState(false);
 const [seoTitle, setSeoTitle] = useState("");
 const [seoDescription, setSeoDescription] = useState("");
 const [keywords, setKeywords] = useState("");
 const [slug, setSlug] = useState("");
 const [isSaving, setIsSaving] = useState(false);

 useEffect(() => {
 fetchPosts();
 }, []);

 const fetchPosts = async () => {
 setIsLoading(true);
 try {
 const data = await apiClient.get<any[]>('/admin/content/posts');
 setPosts(data || []);
 } catch (err) {
 console.error("Failed to fetch posts", err);
 } finally {
 setIsLoading(false);
 }
 };

 const handleOpenEditor = (post: any = null) => {
 if (post) {
 setEditingPost(post);
 setTitle(post.title);
 setContent(post.content);
 setExcerpt(post.excerpt || "");
 setCoverImage(post.coverImage || "");
 setPublished(post.published);
 setSeoTitle(post.seoTitle || "");
 setSeoDescription(post.seoDescription || "");
 setKeywords(post.keywords || "");
 setSlug(post.slug);
 } else {
 setEditingPost(null);
 setTitle("");
 setContent("");
 setExcerpt("");
 setCoverImage("");
 setPublished(false);
 setSeoTitle("");
 setSeoDescription("");
 setKeywords("");
 setSlug("");
 }
 setIsEditorOpen(true);
 };

 const handleSavePost = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title || !content) {
 toast.error("Title and content are required.");
 return;
 }

 setIsSaving(true);
 try {
 const payload = {
 title,
 content,
 excerpt,
 coverImage,
 published,
 seoTitle,
 seoDescription,
 keywords,
 slug
 };

 if (editingPost) {
 await apiClient.put(`/admin/content/posts/${editingPost.id}`, payload);
 toast.success("Post updated successfully!");
 } else {
 await apiClient.post('/admin/content/posts', payload);
 toast.success("Post created successfully!");
 }
 setIsEditorOpen(false);
 fetchPosts();
 } catch (err: any) {
 toast.error(err.message || "Failed to save post");
 } finally {
 setIsSaving(false);
 }
 };

 const handleDeletePost = async (id: string, postTitle: string) => {
 if (!window.confirm(`Are you sure you want to delete "${postTitle}"?`)) return;
 try {
 await apiClient.delete(`/admin/content/posts/${id}`);
 setPosts(posts.filter(p => p.id !== id));
 toast.success("Post deleted");
 } catch (err: any) {
 toast.error(err.message || "Failed to delete post");
 }
 };

 const filteredPosts = posts.filter(p => 
 p.title.toLowerCase().includes(search.toLowerCase()) || 
 (p.slug && p.slug.toLowerCase().includes(search.toLowerCase()))
 );

 return (
 <div className="space-y-8">
 {!isEditorOpen ? (
 <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm">
 <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
 <div>
 <h3 className="text-2xl font-bold text-navy-950 ">Blog Content</h3>
 <p className="text-sm text-navy-950 ">Manage SEO destination guides and organic marketing content.</p>
 </div>
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950 " />
 <input 
 type="text" 
 placeholder="Search articles..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="pl-12 pr-4 h-12 bg-sand-50 border border-sand-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 w-64 transition-colors"
 />
 </div>
 <Button onClick={() => handleOpenEditor()} className="bg-navy-950 text-white h-12 rounded-xl px-6 gap-2">
 <Plus className="w-4 h-4" /> New Article
 </Button>
 </div>
 </div>

 {isLoading ? (
 <div className="flex justify-center py-20">
 <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
 </div>
 ) : filteredPosts.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredPosts.map(post => (
 <div key={post.id} className="bg-sand-50 border border-sand-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
 <div className="h-40 relative overflow-hidden bg-sand-200 ">
 {post.coverImage ? (
 <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={post.title} />
 ) : (
 <div className="flex items-center justify-center w-full h-full text-navy-950 ">
 <FileText className="w-12 h-12" />
 </div>
 )}
 <div className="absolute top-4 right-4">
 <span className={cn(
 "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm",
 post.published ? "bg-emerald-500 text-white" : "bg-sand-300 text-navy-950 "
 )}>
 {post.published ? "Published" : "Draft"}
 </span>
 </div>
 </div>
 <div className="p-6 flex-grow flex flex-col">
 <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
 <Calendar className="w-3 h-3" />
 {new Date(post.createdAt).toLocaleDateString()}
 </p>
 <h4 className="text-lg font-bold text-navy-950 mb-2 line-clamp-2">{post.title}</h4>
 <p className="text-sm text-navy-950 line-clamp-2 mb-6 flex-grow">{post.excerpt || post.content.replace(/<[^>]+>/g, '').substring(0, 100)}</p>
 
 <div className="flex items-center justify-between mt-auto pt-4 border-t border-sand-200 ">
 <div className="flex gap-2">
 <button onClick={() => handleOpenEditor(post)} className="w-10 h-10 rounded-xl bg-white border border-sand-200 text-navy-950 flex items-center justify-center hover:bg-sand-100 :bg-sand-200 transition-colors" title="Edit">
 <Edit3 className="w-4 h-4" />
 </button>
 <button onClick={() => handleDeletePost(post.id, post.title)} className="w-10 h-10 rounded-xl bg-white border border-sand-200 text-red-600 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors" title="Delete">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold text-navy-950 uppercase tracking-widest hover:text-gold-600 transition-colors">
 Preview <Eye className="w-3 h-3" />
 </a>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-20 bg-sand-50 rounded-2xl border border-dashed border-sand-200 ">
 <FileText className="w-12 h-12 text-navy-950 mx-auto mb-4" />
 <h4 className="text-lg font-bold text-navy-950 mb-2">No Articles Found</h4>
 <p className="text-navy-950 max-w-sm mx-auto mb-6">Create your first blog post to start driving organic traffic.</p>
 <Button onClick={() => handleOpenEditor()} className="bg-navy-950 text-white rounded-xl mx-auto">Create Article</Button>
 </div>
 )}
 </div>
 ) : (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm"
 >
 <div className="flex items-center justify-between mb-8 pb-6 border-b border-sand-100 ">
 <h3 className="text-2xl font-bold text-navy-950 ">{editingPost ? "Edit Article" : "New Article"}</h3>
 <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="rounded-xl">Cancel</Button>
 </div>

 <form onSubmit={handleSavePost} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
 {/* Left Column: Main Editor */}
 <div className="lg:col-span-2 space-y-6">
 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 mb-2 block">Article Title *</label>
 <input 
 type="text" 
 required
 value={title}
 onChange={e => setTitle(e.target.value)}
 className="w-full h-14 bg-sand-50 border border-sand-200 rounded-xl px-4 font-bold text-navy-950 outline-none focus:border-gold-500 text-lg"
 placeholder="Enter an engaging title..."
 />
 </div>

 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 mb-2 block">Content (HTML/Markdown) *</label>
 <textarea 
 required
 value={content}
 onChange={e => setContent(e.target.value)}
 className="w-full h-[500px] bg-sand-50 border border-sand-200 rounded-xl p-4 text-navy-950 outline-none focus:border-gold-500 font-mono text-sm resize-y"
 placeholder="Write your article content here..."
 />
 </div>

 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 mb-2 block">Excerpt (Short Summary)</label>
 <textarea 
 value={excerpt}
 onChange={e => setExcerpt(e.target.value)}
 className="w-full h-24 bg-sand-50 border border-sand-200 rounded-xl p-4 text-navy-950 outline-none focus:border-gold-500 text-sm resize-none"
 placeholder="Brief summary for blog listings..."
 />
 </div>
 </div>

 {/* Right Column: Meta & SEO */}
 <div className="space-y-6 bg-sand-50 p-6 rounded-2xl border border-sand-100 ">
 <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-sand-200 shadow-sm">
 <div>
 <p className="font-bold text-navy-950 ">Publish Status</p>
 <p className="text-[10px] text-navy-950 uppercase tracking-widest">{published ? "Live on site" : "Hidden draft"}</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" checked={published} onChange={e => setPublished(e.target.checked)} />
 <div className="w-11 h-6 bg-sand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
 </label>
 </div>

 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 mb-2 block">Cover Image URL</label>
 <input 
 type="url" 
 value={coverImage}
 onChange={e => setCoverImage(e.target.value)}
 className="w-full h-12 bg-white border border-sand-200 rounded-xl px-4 text-sm outline-none focus:border-gold-500"
 placeholder="https://..."
 />
 {coverImage && (
 <div className="mt-3 h-32 rounded-xl overflow-hidden border border-sand-200 ">
 <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
 </div>
 )}
 </div>

 <div className="pt-6 border-t border-sand-200 space-y-4">
 <div className="flex items-center gap-2 text-gold-600 mb-2">
 <Globe className="w-4 h-4" />
 <span className="font-bold text-sm">SEO Settings</span>
 </div>
 
 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 mb-1 block">Custom Slug</label>
 <input 
 type="text" 
 value={slug}
 onChange={e => setSlug(e.target.value)}
 className="w-full h-10 bg-white border border-sand-200 rounded-lg px-3 text-xs outline-none focus:border-gold-500"
 placeholder="Auto-generated if empty"
 />
 </div>
 
 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 mb-1 block">Meta Title</label>
 <input 
 type="text" 
 value={seoTitle}
 onChange={e => setSeoTitle(e.target.value)}
 className="w-full h-10 bg-white border border-sand-200 rounded-lg px-3 text-xs outline-none focus:border-gold-500"
 />
 </div>

 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 mb-1 block">Meta Description</label>
 <textarea 
 value={seoDescription}
 onChange={e => setSeoDescription(e.target.value)}
 className="w-full h-20 bg-white border border-sand-200 rounded-lg p-3 text-xs outline-none focus:border-gold-500 resize-none"
 />
 </div>

 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950 ml-1 mb-1 block">Keywords (comma separated)</label>
 <input 
 type="text" 
 value={keywords}
 onChange={e => setKeywords(e.target.value)}
 className="w-full h-10 bg-white border border-sand-200 rounded-lg px-3 text-xs outline-none focus:border-gold-500"
 />
 </div>
 </div>

 <Button 
 type="submit" 
 isLoading={isSaving}
 className="w-full h-14 bg-gold-500 hover:bg-gold-600 text-navy-950 rounded-xl shadow-luxury mt-6 font-bold text-lg"
 >
 {editingPost ? "Save Changes" : "Publish Article"}
 </Button>
 </div>
 </form>
 </motion.div>
 )}
 </div>
 );
}
