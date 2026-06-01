const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/owner/OwnerDashboard.tsx', 'utf8');

const importsToAdd = `import { compressImageFile } from "../../utils/image";
import { Eye, RefreshCw, Star, Image as ImageIcon } from "lucide-react";`;

code = code.replace(/import \{ apiClient \} from "\.\.\/\.\.\/utils\/apiClient";/, `import { apiClient } from "../../utils/apiClient";\n${importsToAdd}\n`);

const uploadHelper = `  const handlePhotoUpload = async (file: File | undefined, endpoint: string) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(\`Unsupported format: \${file.type.replace('image/', '').toUpperCase()}. Please upload JPG, PNG, or WEBP.\`);
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const currentSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(\`Image exceeds 5MB limit. Current size: \${currentSizeMB}MB. Please compress your image.\`);
      return;
    }
    const toastId = toast.loading('Uploading... 0%');
    try {
      toast.loading('Optimizing image...', { id: toastId });
      const optimizedDataUrl = await compressImageFile(file, 1920);
      toast.loading('Uploading to gallery... 50%', { id: toastId });
      await apiClient.post(endpoint, { url: optimizedDataUrl });
      toast.success('Photo uploaded successfully', { id: toastId });
      fetchResorts();
    } catch (err: any) {
      toast.error(err.message || 'Upload interrupted. Please try again.', { id: toastId });
    }
  };

  const setCoverImage = async (roomId: string, imgUrl: string) => {
    try {
      await apiClient.patch(\`/rooms/\${roomId}/cover\`, { url: imgUrl });
      toast.success('Cover image updated');
      fetchResorts();
    } catch(e) {
      toast.error('Failed to set cover image');
    }
  };
`;

code = code.replace(/(const handleCancelBooking = .*?\n  };)/s, `$1\n\n${uploadHelper}`);

const roomGalleryRegex = /\{\/\* Room Photos Manager \*\/}.*?<div className="bg-white rounded-\[3rem\] border border-sand-100 shadow-sm overflow-hidden">/s;

const newRoomGallery = `{/* Room Photos Manager */}
                              <div className="mt-6 pt-6 border-t border-sand-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/30 mb-3">Room Gallery</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {room.images?.map((img: string, i: number) => (
                                    <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden group border border-sand-200">
                                      <img src={img} className="w-full h-full object-cover" />
                                      {room.coverImage === img && (
                                        <div className="absolute top-2 left-2 bg-gold-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                          <Star className="w-3 h-3" fill="currentColor" /> Cover
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-navy-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-2">
                                        <div className="flex items-center gap-2">
                                          <button onClick={() => window.open(img, '_blank')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="View Image">
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => setCoverImage(room.id, img)} className="p-2 bg-white/10 hover:bg-gold-500 rounded-lg text-white transition-colors" title="Set Cover Image">
                                            <Star className="w-4 h-4" />
                                          </button>
                                          <label className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer" title="Replace Image">
                                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if(!file) return;
                                              await handlePhotoUpload(file, \`/rooms/\${room.id}/photos\`);
                                              await apiClient.delete(\`/rooms/\${room.id}/photos\`, { data: { url: img } });
                                            }} />
                                            <RefreshCw className="w-4 h-4" />
                                          </label>
                                          <button 
                                            onClick={() => {
                                              luxuryConfirm({
                                                title: "Delete Room Photo",
                                                onConfirm: async () => {
                                                  try {
                                                    await apiClient.delete(\`/rooms/\${room.id}/photos\`, { data: { url: img } });
                                                    fetchResorts();
                                                    toast.success("Photo deleted successfully");
                                                  } catch(e) { toast.error("Failed to delete photo. Please try again."); }
                                                }
                                              });
                                            }}
                                            className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition-colors" title="Delete Image"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-sand-200 flex flex-col items-center justify-center text-navy-950/40 hover:border-gold-300 hover:text-gold-500 hover:bg-gold-50/50 transition-all cursor-pointer">
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files?.[0], \`/rooms/\${room.id}/photos\`)} />
                                    <Plus className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Add Photo</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Property Gallery */}
                    <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">`;

code = code.replace(roomGalleryRegex, newRoomGallery);

const propertyGalleryRegex = /<input type="file" accept="image\/\*" className="hidden" disabled=\{isUpdatingResortPhotos\} onChange=\{async \(e\) => \{[\s\S]*?<\/label>/;

const newPropertyGallery = `<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isUpdatingResortPhotos} onChange={async (e) => {
                              setIsUpdatingResortPhotos(true);
                              await handlePhotoUpload(e.target.files?.[0], \`/resorts/\${resort.id}/photos\`);
                              setIsUpdatingResortPhotos(false);
                            }} />
                            {isUpdatingResortPhotos ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Add Photo"}
                          </label>`;

code = code.replace(propertyGalleryRegex, newPropertyGallery);

fs.writeFileSync('frontend/src/pages/owner/OwnerDashboard.tsx', code);
console.log("Successfully replaced OwnerDashboard.tsx content.");
