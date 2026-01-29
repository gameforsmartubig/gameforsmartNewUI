"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/canvasUtils";
import { Slider } from "@/components/ui/slider";

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: {
        name: string;
        username: string;
        location: string;
        bio?: string;
        avatar?: string;
    };
    onSave: (data: { name: string; username: string; location: string; bio?: string; avatar?: string }) => void;
}

export function EditProfileDialog({
    open,
    onOpenChange,
    initialData,
    onSave,
}: EditProfileDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(initialData);

    // Cropper State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCropper, setShowCropper] = useState(false);

    // Reset form when dialog opens with new data
    useEffect(() => {
        if (open) {
            setFormData(initialData);
            setImageSrc(null);
            setShowCropper(false);
        }
    }, [open, initialData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File terlalu besar (max 5MB)");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset input value so the same file selection triggers change event
        e.target.value = '';
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const applyCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                setFormData(prev => ({ ...prev, avatar: croppedImage }));
                setShowCropper(false);
                setImageSrc(null);
            }
        } catch (e) {
            console.error(e);
            toast.error("Gagal memotong gambar");
        }
    };

    const cancelCrop = () => {
        setShowCropper(false);
        setImageSrc(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // In a real app, you would update the backend here.
            // For now, we'll just show a success message.
            console.log("Updated data:", formData);
            onSave(formData);
            toast.success("Profil berhasil diperbarui!");
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            toast.error("Gagal memperbarui profil");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        {showCropper
                            ? "Atur posisi dan ukuran foto profil Anda."
                            : "Ubah informasi profil dan foto Anda di sini."}
                    </DialogDescription>
                </DialogHeader>

                {showCropper ? (
                    <div className="flex flex-col gap-4">
                        <div className="relative w-full h-64 bg-slate-900 rounded-md overflow-hidden">
                            <Cropper
                                image={imageSrc || ""}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="flex items-center gap-4 px-2">
                            <ZoomOut className="h-4 w-4 text-muted-foreground" />
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(value) => setZoom(value[0])}
                                className="flex-1"
                            />
                            <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <DialogFooter className="mt-4 gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={cancelCrop}>
                                Batal
                            </Button>
                            <Button type="button" onClick={applyCrop}>
                                Terapkan
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">

                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center justify-center gap-4 mb-4">
                                <div className="relative group cursor-pointer overflow-hidden rounded-full border-2 border-border">
                                    <img
                                        src={formData.avatar || "https://github.com/shadcn.png"}
                                        alt="Avatar Preview"
                                        className="h-24 w-24 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                        <span className="text-white text-xs font-semibold">Ganti Foto</span>
                                    </div>
                                </div>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Nama
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="text-right">
                                    Username
                                </Label>
                                <div className="col-span-3 relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                        @
                                    </span>
                                    <Input
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="pl-8"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="location" className="text-right">
                                    Lokasi
                                </Label>
                                <Input
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="bio" className="text-right pt-2">
                                    Bio
                                </Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio || ""}
                                    onChange={handleChange}
                                    className="col-span-3"
                                    placeholder="Tulis sedikit tentang diri Anda..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
