'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/logSupabaseError';
import type { UsersProfile } from '@/lib/types';

// Tipe akun berasal dari satu sumber, yaitu src/lib/types.ts.
export type { UserRole } from '@/lib/types';

// 'found'   : profil termuat
// 'missing' : kueri berhasil, tapi baris users_profile untuk user ini tidak ada
// 'error'   : kueri gagal, jadi hak akses belum bisa diperiksa
export type ProfileStatus = 'idle' | 'loading' | 'found' | 'missing' | 'error';

// Hasil kueri profil disimpan bersama id user dan nomor permintaannya. Status loading
// dihitung dari keduanya saat render, jadi tidak ada flag manual yang bisa tertinggal
// menyala selamanya atau padam sebelum hasil untuk user yang sekarang datang.
type ProfileResult = { userId: string; requestId: number } & (
    | { status: 'found'; profile: UsersProfile }
    | { status: 'missing' }
    | { status: 'error'; message: string }
);

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UsersProfile | null;
    profileStatus: ProfileStatus;
    profileError: string | null;
    loading: boolean;
    profileLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, nama: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    retryProfile: () => void;
    isAdmin: boolean;
    isGuru: boolean;
    canAccessAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
    const [profileRequest, setProfileRequest] = useState(0);

    // Menjadi true begitu listener mengirim event pertama. Sejak itu sesi hanya boleh
    // dipasang oleh event, dan pengaman getSession() di bawah tidak boleh menyentuhnya.
    const receivedAuthEvent = useRef(false);

    useEffect(() => {
        let isMounted = true;

        // Callback ini SENGAJA sinkron: jangan tambahkan async, await, atau panggilan
        // Supabase apa pun di dalamnya. auth-js menjalankannya di dalam lock eksklusif,
        // dan panggilan Supabase yang ikut meminta lock itu membuat keduanya saling
        // menunggu selamanya. Pengambilan profil ada di efek terpisah di bawah.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!isMounted) return;
            receivedAuthEvent.current = true;
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            // Diturunkan untuk SEMUA event, termasuk INITIAL_SESSION dengan session null.
            setLoading(false);
        });

        // Pengaman untuk jalur di mana listener tidak pernah mengirim event sama sekali,
        // misalnya lock auth lintas tab gagal didapat dalam 10 detik sehingga
        // initialize() gagal. Hanya bertindak kalau belum ada event yang datang.
        supabase.auth
            .getSession()
            .then(({ data, error }) => {
                if (error) logSupabaseError('Auth init error:', error);
                if (!isMounted || receivedAuthEvent.current) return;
                setSession(data.session);
                setUser(data.session?.user ?? null);
                setLoading(false);
            })
            .catch((error: unknown) => {
                logSupabaseError('Auth init error:', error);
                if (!isMounted || receivedAuthEvent.current) return;
                setLoading(false);
            });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const userId = user?.id ?? null;

    useEffect(() => {
        if (!userId) return;

        const requestId = profileRequest;
        let ignore = false;

        const load = async () => {
            try {
                // maybeSingle(): baris yang tidak ada kembali sebagai data null tanpa
                // error, sehingga profil kosong bisa dibedakan dari kueri yang gagal.
                const { data, error } = await supabase
                    .from('users_profile')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (ignore) return;

                if (error) {
                    logSupabaseError('Error fetching profile:', error);
                    setProfileResult({ userId, requestId, status: 'error', message: error.message });
                } else if (data) {
                    setProfileResult({ userId, requestId, status: 'found', profile: data as UsersProfile });
                } else {
                    setProfileResult({ userId, requestId, status: 'missing' });
                }
            } catch (error) {
                if (ignore) return;
                logSupabaseError('Error fetching profile:', error);
                setProfileResult({
                    userId,
                    requestId,
                    status: 'error',
                    message: error instanceof Error ? error.message : '',
                });
            }
        };

        load();

        return () => {
            ignore = true;
        };
    }, [userId, profileRequest]);

    const retryProfile = useCallback(() => {
        setProfileRequest((n) => n + 1);
    }, []);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            // Kalau berhasil, event SIGNED_IN dari listener yang menurunkan loading.
            if (error) setLoading(false);
            return { error: error as Error | null };
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const signUp = async (email: string, password: string, nama: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nama },
            },
        });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
        } finally {
            setLoading(false);
        }
    };

    // Hasil profil hanya berlaku kalau milik user yang sekarang dan permintaan terbaru.
    const currentResult =
        userId !== null &&
        profileResult !== null &&
        profileResult.userId === userId &&
        profileResult.requestId === profileRequest
            ? profileResult
            : null;

    const profileStatus: ProfileStatus =
        userId === null ? 'idle' : currentResult === null ? 'loading' : currentResult.status;
    const profileLoading = profileStatus === 'loading';
    const profile = currentResult !== null && currentResult.status === 'found' ? currentResult.profile : null;
    const profileError = currentResult !== null && currentResult.status === 'error' ? currentResult.message : null;

    const isAdmin = profile?.role === 'admin';
    const isGuru = profile?.role === 'guru';
    const canAccessAdmin = isAdmin || isGuru;

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                profileStatus,
                profileError,
                loading,
                profileLoading,
                signIn,
                signUp,
                signOut,
                retryProfile,
                isAdmin,
                isGuru,
                canAccessAdmin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
