class AudioManager {

    private currentMusic: HTMLAudioElement | null = null;
    private volume: number = 1.0;

    play(path: string) {

        if (this.currentMusic) {
            this.currentMusic.pause();
        }

        this.currentMusic = new Audio(path);
        this.currentMusic.loop = true;
        this.currentMusic.volume = this.volume;

        // Talla els últims 5 segons reiniciant la reproducció
        this.currentMusic.addEventListener("timeupdate", () => {
            if (this.currentMusic && this.currentMusic.duration && this.currentMusic.currentTime >= this.currentMusic.duration - 5) {
                this.currentMusic.currentTime = 0;
            }
        });

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