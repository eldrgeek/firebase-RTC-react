export function combineStreams(stream1, stream2) {
    return Promise.all([stream1, stream2]).then(([stream1, stream2]) => {
        if (stream1 && stream2) {
            const tracks = stream2.getTracks();
            tracks.forEach(track => stream1.addTrack(track));
            return stream1;
        }
    });
    // .then((result)=>(console.log(result)));
}
export function splitStream(stream) {
    return Promise.resolve(stream).then(stream => {
        const audioTracks = stream.getAudioTracks();
        const videoTracks = stream.getVideoTracks();
        const splits = []
        for (let index = 0; index < videoTracks.length; index++) {
            const tracks = []
            const pushTrack = track => {
                if (track) tracks.push(track);
            };
            pushTrack(audioTracks[index]);
            pushTrack(videoTracks[index]);
            splits[index] = new MediaStream(tracks);
        }
        return splits;
    });
}
