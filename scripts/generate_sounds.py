import math
import struct
import wave
import os

os.makedirs("public/sounds", exist_ok=True)

SAMPLE_RATE = 44100

def write_wav(filename, samples):
    with wave.open(filename, "w") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        
        # Clamp and convert floats (-1.0 to 1.0) to 16-bit signed integers
        raw_data = bytearray()
        for sample in samples:
            clamped = max(-1.0, min(1.0, sample))
            int_val = int(clamped * 32767)
            raw_data.extend(struct.pack("<h", int_val))
            
        wav_file.writeframes(raw_data)

# 1. Generate Coin Sound (Coin clink / medal chime)
# High pitch duo-tone chime B5 -> E6 with exponential decay & metallic ring
def generate_coin():
    duration = 0.35
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    import random
    rng = random.Random(42)
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        
        # Envelope for tone 1 (B5 = 987.77 Hz)
        env1 = math.exp(-35 * t) if t < 0.1 else 0
        tone1 = (math.sin(2 * math.pi * 987.77 * t) + 0.4 * math.sin(2 * math.pi * 1975.54 * t)) * env1
        
        # Envelope for tone 2 (E6 = 1318.51 Hz) starting at t = 0.06s
        t2 = t - 0.06
        if t2 > 0:
            env2 = math.exp(-14 * t2)
            tone2 = (math.sin(2 * math.pi * 1318.51 * t2) +
                     0.3 * math.sin(2 * math.pi * 2637.02 * t2) +
                     0.15 * math.sin(2 * math.pi * 3955.53 * t2)) * env2
        else:
            tone2 = 0
            
        # Initial metallic transient noise burst (0.015s)
        noise = (rng.uniform(-1, 1) * math.exp(-200 * t)) if t < 0.015 else 0
        
        mix = (tone1 * 0.4 + tone2 * 0.6 + noise * 0.15)
        samples.append(mix)
        
    return samples

# 2. Generate Stamp Sound (Rubber stamp thud + paper slap)
# Deep pitch sweep (180Hz -> 45Hz) + initial paper noise slap
def generate_stamp():
    duration = 0.25
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    import random
    rng = random.Random(123)
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        
        # Frequency drop for heavy thud (180Hz down to 40Hz)
        freq = 40 + (180 - 40) * math.exp(-50 * t)
        
        # Heavy sub-thud sine wave with fast exponential decay
        thud_env = math.exp(-20 * t)
        thud = math.sin(2 * math.pi * freq * t) * thud_env
        
        # Punchy mid-body knock (90Hz)
        knock_env = math.exp(-40 * t)
        knock = math.sin(2 * math.pi * 90 * t + 0.5) * knock_env
        
        # Paper slap noise burst (first 35ms)
        slap_env = math.exp(-80 * t) if t < 0.04 else 0
        # Simple high pass / band pass approximation for crisp slap
        slap = rng.uniform(-1, 1) * slap_env
        
        mix = (thud * 0.6 + knock * 0.25 + slap * 0.35)
        samples.append(mix)
        
    return samples

if __name__ == "__main__":
    coin_samples = generate_coin()
    write_wav("public/sounds/coin.wav", coin_samples)
    print("Generated public/sounds/coin.wav")
    
    stamp_samples = generate_stamp()
    write_wav("public/sounds/stamp.wav", stamp_samples)
    print("Generated public/sounds/stamp.wav")
