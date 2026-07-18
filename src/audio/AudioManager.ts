class AudioManager {

    private currentMusic: HTMLAudioElement | null = null;
    private currentPath: string | null = null;
    private volume: number = 1.0;

    play(path: string) {
        // No reinicia la música si ja està reproduint la mateixa pista
        if (this.currentMusic && this.currentPath === path) {
            // Si estava pausada, la reprèn
            if (this.currentMusic.paused) {
                const playPromise = this.currentMusic.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(() => {});
                }
            }
            return;
        }

        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.src = "";
        }

        this.currentMusic = new Audio(path);
        this.currentPath = path;
        this.currentMusic.loop = true;
        this.currentMusic.volume = this.volume;

        // Intenta reproduir immediatament; si el navegador ho bloqueja, reintenta al primer clic
        const playPromise = this.currentMusic.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                const resume = () => {
                    this.currentMusic?.play();
                    document.removeEventListener("click", resume);
                    document.removeEventListener("keydown", resume);
                };
                document.addEventListener("click", resume);
                document.addEventListener("keydown", resume);
            });
        }
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.volume;
        }
    }

    getVolume(): number {
        return this.volume;
    }

    stop() {
        this.currentMusic?.pause();
    }
}

export default new AudioManager();