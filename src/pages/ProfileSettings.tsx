import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Save, ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components/layout/Navbar";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Dubai",
  "Australia/Sydney", "Australia/Perth",
];

function computeAge(birthday: string | null): number | null {
  if (!birthday) return null;
  const b = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    avatar_url: "",
    sex: "",
    weight_kg: "",
    height_cm: "",
    birthday: "",
    unit_preference: "metric",
    timezone: "",
    location: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        const unitPref = (data as any).unit_preference || "metric";
        let weightDisplay = (data as any).weight_kg?.toString() || "";
        let heightDisplay = (data as any).height_cm?.toString() || "";
        // Convert stored metric values to imperial for display
        if (unitPref === "imperial") {
          if ((data as any).weight_kg) weightDisplay = (Math.round((data as any).weight_kg * 2.20462 * 10) / 10).toString();
          if ((data as any).height_cm) heightDisplay = (Math.round((data as any).height_cm / 2.54 * 10) / 10).toString();
        }
        setForm({
          first_name: (data as any).first_name || "",
          last_name: (data as any).last_name || "",
          display_name: data.display_name || "",
          avatar_url: data.avatar_url || "",
          sex: (data as any).sex || "",
          weight_kg: weightDisplay,
          height_cm: heightDisplay,
          birthday: (data as any).birthday || "",
          unit_preference: unitPref,
          timezone: (data as any).timezone || "",
          location: (data as any).location || "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + "?t=" + Date.now();

    await supabase.from("user_profiles").update({ avatar_url: avatarUrl } as any).eq("id", user.id);
    setForm(prev => ({ ...prev, avatar_url: avatarUrl }));
    setUploading(false);
    toast.success("Avatar updated!");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Convert imperial values to metric for storage
    let weightKg = form.weight_kg ? parseFloat(form.weight_kg) : null;
    let heightCm = form.height_cm ? parseFloat(form.height_cm) : null;
    if (form.unit_preference === "imperial") {
      if (weightKg !== null) weightKg = Math.round(weightKg * 0.453592 * 10) / 10; // lbs -> kg
      if (heightCm !== null) heightCm = Math.round(heightCm * 2.54 * 10) / 10; // in -> cm
    }

    const updateData: any = {
      display_name: form.display_name.trim() || form.first_name.trim() || "Anonymous",
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      sex: form.sex || null,
      weight_kg: weightKg,
      height_cm: heightCm,
      birthday: form.birthday || null,
      unit_preference: form.unit_preference,
      timezone: form.timezone || null,
      location: form.location.trim() || null,
    };

    const { error } = await supabase.from("user_profiles").update(updateData).eq("id", user.id);
    setSaving(false);

    if (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } else {
      toast.success("Profile updated!");
    }
  };

  const age = computeAge(form.birthday);
  const initials = ((form.first_name?.[0] || "") + (form.last_name?.[0] || "")).toUpperCase() || "U";

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-12">
        <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10 container mx-auto max-w-2xl px-4">
          <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your personal details and profile photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {loading ? (
                <div className="text-muted-foreground text-sm">Loading profile...</div>
              ) : (
                <>
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={form.avatar_url} />
                        <AvatarFallback className="text-2xl bg-primary/20 text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{form.display_name || "Your Name"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      {uploading && <p className="text-xs text-primary mt-1">Uploading...</p>}
                    </div>
                  </div>

                  {/* Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input id="first_name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input id="last_name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input id="display_name" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Display name" />
                    <p className="text-xs text-muted-foreground">This name is shown across the app</p>
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled className="opacity-60" />
                  </div>

                  {/* Sex / Birthday / Age Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select value={form.sex} onValueChange={v => setForm(f => ({ ...f, sex: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday">Birthday</Label>
                      <Input id="birthday" type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input value={age !== null ? `${age} years` : "—"} disabled className="opacity-60" />
                    </div>
                  </div>

                  {/* Weight / Height / Unit Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight ({form.unit_preference === "imperial" ? "lbs" : "kg"})</Label>
                      <Input id="weight" type="number" step="0.1" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height ({form.unit_preference === "imperial" ? "in" : "cm"})</Label>
                      <Input id="height" type="number" step="0.1" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Preference</Label>
                      <Select value={form.unit_preference} onValueChange={v => setForm(f => ({ ...f, unit_preference: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                          <SelectItem value="imperial">Imperial (lbs/in)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location / Timezone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={form.timezone} onValueChange={v => setForm(f => ({ ...f, timezone: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map(tz => (
                            <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
