import { Album } from "lucide-react";
import { useState } from "react";

export const useLocalMusic = () => {
    const [tracks, setTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleFolderSelect = async (event) => {
        const files = Array.from(event.target.files);
        if (!files || files.length === 0 ) return;

        setIsLoading(true);

        const audioFiles = files.filter((file) =>
            ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg", "audio/mp4"].includes(file.type) || file.name.match(/\.(mp3|wav|flac|m4a|ogg)$/i)
        );

        const parsedTracks = audioFiles.map((file, index) => {
            const cleanName = file.name.replace(/\.[^/.]+$/, "");
            const parts = cleanName.split("-");
            const artist = parts.length > 1 ? parts[0].trim() : "Unknown Artist";
            const title = parts.length > 1 ? parts.slice(1).join("-").trim() : cleanName;

            return {
                id: `local-${index}-${file.name}`,
                title,
                artist,
                Album: "Local Library",
                url: URL.createObjectURL(file),
                file,
                isLocal: true,
            };
        });

        setTracks(parsedTracks);
        setIsLoading(false);
    };

    return {
        tracks,
        isLoading,
        handleFolderSelect,
    };
};
