import { createClient } from '@supabase/supabase-js';
import { logSupabaseError } from '@/lib/logSupabaseError';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage helpers
export const RECORDINGS_BUCKET = 'recordings';

export async function uploadAudioFile(file: File): Promise<{ path: string; url: string; error?: string } | null> {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    console.log('Uploading to bucket:', RECORDINGS_BUCKET);
    console.log('File name:', fileName);

    const { data, error } = await supabase.storage
        .from(RECORDINGS_BUCKET)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        logSupabaseError('Supabase Storage Upload Error:', error);
        alert(`Upload error: ${error.message}\n\nPastikan:\n1. Bucket 'recordings' sudah dibuat di Supabase Storage\n2. Bucket diset sebagai PUBLIC\n3. Policy storage sudah dikonfigurasi`);
        return null;
    }

    const { data: urlData } = supabase.storage
        .from(RECORDINGS_BUCKET)
        .getPublicUrl(data.path);

    return {
        path: data.path,
        url: urlData.publicUrl,
    };
}

export async function deleteAudioFile(path: string): Promise<boolean> {
    const { error } = await supabase.storage
        .from(RECORDINGS_BUCKET)
        .remove([path]);

    if (error) {
        logSupabaseError('Delete error:', error);
        return false;
    }

    return true;
}
