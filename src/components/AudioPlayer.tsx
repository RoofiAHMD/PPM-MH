'use client';

import { useState, useRef, useEffect } from 'react';
import { Recording, formatDate } from '@/lib/types';
import { Mic, Music, SkipBack, SkipForward, Play, Pause, Repeat, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
    recording: Recording | null;
    onPlayCountUpdate?: () => void;
}

export default function AudioPlayer({ recording, onPlayCountUpdate }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isRepeating, setIsRepeating] = useState(false);
    const [hasCountedPlay, setHasCountedPlay] = useState(false);
    const [waveformHeights, setWaveformHeights] = useState<number[]>(
        Array.from({ length: 15 }, () => Math.random() * 20 + 20)
    );

    const speeds = [1, 1.25, 1.5, 1.75, 2];

    // Dynamic waveform animation
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setWaveformHeights(prev =>
                prev.map((h) => {
                    // Create wave-like pattern with some randomness
                    const baseChange = (Math.random() - 0.5) * 40;
                    const newHeight = h + baseChange;
                    // Keep heights between 15% and 100%
                    return Math.max(15, Math.min(100, newHeight));
                })
            );
        }, 100); // Update every 100ms for smooth animation

        return () => clearInterval(interval);
    }, [isPlaying]);

    useEffect(() => {
        setHasCountedPlay(false);
        setIsPlaying(false);
        setCurrentTime(0);
    }, [recording?.id]);

    const togglePlay = async () => {
        if (!audioRef.current || !recording) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();

            // Increment play count on first play
            if (!hasCountedPlay) {
                setHasCountedPlay(true);
                try {
                    await fetch(`/api/recordings/${recording.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ increment_play_count: true }),
                    });
                    onPlayCountUpdate?.();
                } catch (error) {
                    console.error('Failed to update play count:', error);
                }
            }
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        if (isRepeating && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = (parseFloat(e.target.value) / 100) * duration;
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value) / 100;
        setVolume(vol);
        if (audioRef.current) {
            audioRef.current.volume = vol;
        }
        setIsMuted(vol === 0);
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleSpeed = () => {
        const currentIndex = speeds.indexOf(playbackRate);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const skip = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!recording) {
        return (
            <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl shadow-2xl p-8 text-white mb-8">
                <div className="text-center py-12">
                    <Music className="w-16 h-16 opacity-50 mx-auto mb-4" />
                    <p className="text-xl opacity-75">Belum ada kajian aktif</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl shadow-2xl p-8 text-white mb-8">
            <audio
                ref={audioRef}
                src={recording.file_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />

            <div className="text-center mb-8">
                <div className="inline-block bg-white bg-opacity-20 rounded-full p-8 mb-6">
                    <Mic className="w-16 h-16" />
                </div>
                <h2 className="text-3xl font-bold mb-2">{recording.title}</h2>
                <p className="text-green-200 text-lg mb-1">{recording.speaker}</p>
                <p className="text-green-300 text-sm">
                    {formatDate(recording.date)}
                </p>
            </div>

            {/* Waveform Animation */}
            <div className="flex items-end justify-center gap-2 h-24 mb-6">
                {waveformHeights.map((height, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-full w-2 transition-all duration-100 ease-out"
                        style={{
                            height: isPlaying ? `${height}%` : '30%',
                            opacity: isPlaying ? 0.5 + (height / 100) * 0.5 : 0.6,
                        }}
                    />
                ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="w-full h-2 pt-1 border border-white/50 bg-opacity-30 rounded-full border-1 border-white appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
                <button
                    onClick={() => skip(-5)}
                    className="hover:scale-110 transition relative group"
                    title="Kembali 5 detik"
                >
                    <SkipBack size={28} />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        Kembali 5 detik
                    </span>
                </button>
                <button
                    onClick={togglePlay}
                    className="bg-white text-green-600 rounded-full w-16 h-16 flex items-center justify-center hover:scale-110 transition shadow-lg"
                >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </button>
                <button
                    onClick={() => skip(5)}
                    className="hover:scale-110 transition relative group"
                    title="Lewati 5 detik"
                >
                    <SkipForward size={28} />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        Lewati 5 detik
                    </span>
                </button>
            </div>

            {/* Additional Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSpeed}
                        className="bg-white text-green-600 bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition"
                    >
                        {playbackRate}x
                    </button>
                    <button
                        onClick={() => setIsRepeating(!isRepeating)}
                        className={`px-3 py-2 rounded-lg transition text-green-600 ${isRepeating ? 'bg-white bg-opacity-40' : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                            }`}
                    >
                        <Repeat size={18} />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleMute}>
                        {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume * 100}
                        onChange={handleVolumeChange}
                        className="w-24 h-2 pt-1 border border-white/50 bg-opacity-30 rounded-full appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
}
