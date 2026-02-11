'use client';

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

type Soundscape = 'silence' | 'brown_noise' | 'rain' | 'wind' | 'cafe';

interface AudioNodes {
  noise: Tone.Noise;
  gain: Tone.Gain;
  extras: Tone.ToneAudioNode[];
}

function createSoundscape(type: Exclude<Soundscape, 'silence'>): AudioNodes {
  const gain = new Tone.Gain(0.5).toDestination();
  const extras: Tone.ToneAudioNode[] = [];

  switch (type) {
    case 'brown_noise': {
      const noise = new Tone.Noise('brown').connect(gain);
      return { noise, gain, extras };
    }

    case 'rain': {
      // Pink noise with a bandpass filter + subtle LFO for patter variation
      const filter = new Tone.Filter({ frequency: 2000, type: 'bandpass', Q: 0.8 });
      const lfo = new Tone.LFO({ frequency: 0.3, min: 1200, max: 2800 });
      lfo.connect(filter.frequency);
      lfo.start();
      filter.connect(gain);
      extras.push(filter, lfo);
      const noise = new Tone.Noise('pink').connect(filter);
      return { noise, gain, extras };
    }

    case 'wind': {
      // White noise through a lowpass filter with slow LFO modulation
      const filter = new Tone.Filter({ frequency: 600, type: 'lowpass', rolloff: -24 });
      const lfo = new Tone.LFO({ frequency: 0.1, min: 300, max: 900 });
      lfo.connect(filter.frequency);
      lfo.start();
      filter.connect(gain);
      extras.push(filter, lfo);
      const noise = new Tone.Noise('white').connect(filter);
      return { noise, gain, extras };
    }

    case 'cafe': {
      // Brown noise at lower volume with gentle autoFilter for ambiance
      const autoFilter = new Tone.AutoFilter({
        frequency: 0.08,
        baseFrequency: 200,
        octaves: 2.5,
      }).connect(gain);
      autoFilter.start();
      extras.push(autoFilter);
      const noise = new Tone.Noise('brown').connect(autoFilter);
      // Cafe is softer by default
      gain.gain.value = 0.3;
      return { noise, gain, extras };
    }
  }
}

function disposeNodes(nodes: AudioNodes) {
  try {
    nodes.noise.stop();
  } catch {
    // noise may not have been started
  }
  nodes.noise.dispose();
  nodes.gain.dispose();
  for (const node of nodes.extras) {
    node.dispose();
  }
}

/**
 * Manages Tone.js audio for focus soundscapes.
 * Handles AudioContext resume (required by browsers), node lifecycle, and cleanup.
 */
export function useAudioEngine(soundscape: string, volume: number) {
  const nodesRef = useRef<AudioNodes | null>(null);
  const contextStartedRef = useRef(false);

  // Start or switch soundscape
  useEffect(() => {
    // Tear down previous nodes whenever soundscape changes
    if (nodesRef.current) {
      disposeNodes(nodesRef.current);
      nodesRef.current = null;
    }

    if (soundscape === 'silence') return;

    let cancelled = false;

    async function startAudio() {
      // Ensure AudioContext is running (browsers require user gesture)
      if (!contextStartedRef.current) {
        try {
          await Tone.start();
          contextStartedRef.current = true;
        } catch {
          // AudioContext couldn't start — likely no user gesture yet.
          // The next soundscape selection (which IS a user gesture) will succeed.
          return;
        }
      }

      if (cancelled) return;

      const type = soundscape as Exclude<Soundscape, 'silence'>;
      const nodes = createSoundscape(type);
      nodes.gain.gain.value = type === 'cafe' ? volume * 0.6 : volume;
      nodes.noise.start();
      nodesRef.current = nodes;
    }

    startAudio();

    return () => {
      cancelled = true;
      if (nodesRef.current) {
        disposeNodes(nodesRef.current);
        nodesRef.current = null;
      }
    };
  }, [soundscape]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update volume reactively without recreating nodes
  useEffect(() => {
    if (nodesRef.current) {
      const isCafe = soundscape === 'cafe';
      nodesRef.current.gain.gain.rampTo(isCafe ? volume * 0.6 : volume, 0.1);
    }
  }, [volume, soundscape]);

  // Cleanup all nodes on unmount
  useEffect(() => {
    return () => {
      if (nodesRef.current) {
        disposeNodes(nodesRef.current);
        nodesRef.current = null;
      }
    };
  }, []);
}
