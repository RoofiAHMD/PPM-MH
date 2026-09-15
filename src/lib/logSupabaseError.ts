// Objek error Supabase (PostgrestError, StorageError, AuthError) adalah turunan Error,
// sehingga `message` tidak enumerable dan sering hilang saat objeknya dicatat mentah.
// Helper ini menyalin properti yang berguna ke objek biasa sebelum mencetaknya.
export function logSupabaseError(context: string, error: unknown): void {
    if (error && typeof error === 'object') {
        // Destructuring membaca lewat akses properti biasa, jadi `message`
        // yang tidak enumerable tetap ikut terambil.
        const { message, code, details, hint, status } = error as Record<string, unknown>;
        console.error(context, { message, code, details, hint, status });
        return;
    }
    console.error(context, error);
}
