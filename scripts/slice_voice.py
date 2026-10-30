import subprocess
import os
import json

def main():
    wav_path = "voices/raw/bao_voice.wav"
    out_dir = "voices/slices"
    os.makedirs(out_dir, exist_ok=True)

    # 20 sentences read by the user
    sentences = [
        "Dạ em chào anh chị, em là Bảo từ đội ngũ giải pháp trí tuệ nhân tạo AI Sales Agent.",
        "Hôm nay em liên hệ để hỗ trợ anh chị tìm hiểu giải pháp tổng đài tự động và chăm sóc khách hàng đa kênh.",
        "Hệ thống của bên em được thiết kế nhằm giúp doanh nghiệp tối ưu chi phí vận hành và tăng trưởng doanh thu 24/7.",
        "Không biết hiện tại quy mô đội ngũ bán hàng của công ty mình đang có bao nhiêu nhân sự vậy ạ?",
        "Dạ vâng, bên em có gói Starter giá 2 triệu đồng một tháng, rất phù hợp cho các doanh nghiệp vừa và nhỏ.",
        "Với các doanh nghiệp cần tích hợp đầy đủ Voice AI và điều phối đa tác tử, gói Pro 5 triệu đồng một tháng là lựa chọn tối ưu nhất.",
        "Toàn bộ báo giá chi tiết và lộ trình triển khai em đã gửi qua email và số điện thoại Zalo của anh chị rồi ạ.",
        "Anh chị có thể trải nghiệm đầy đủ tính năng trong 14 ngày dùng thử hoàn toàn miễn phí.",
        "Mọi thắc mắc của anh chị đều được hệ thống trợ lý ảo và kỹ sư kỹ thuật hỗ trợ trực tiếp bất cứ lúc nào.",
        "Dạ em hiểu những lo lắng của anh chị về vấn đề bảo mật dữ liệu doanh nghiệp.",
        "Toàn bộ cơ sở dữ liệu đều được mã hóa theo tiêu chuẩn ngân hàng và triển khai trực tiếp trên máy chủ nội bộ.",
        "Hệ thống có thể tự động nhận diện nhu cầu khách hàng, chấm điểm tiềm năng và nhắc nhở lịch hẹn chính xác.",
        "Em xin phép gửi lại bản hợp đồng mẫu để ban giám đốc bên mình tham khảo trước nhé ạ.",
        "Nếu anh chị cần buổi demo trực tiếp qua Google Meet hoặc Zoom, em sẽ sắp xếp ngay trong chiều nay.",
        "Dạ vâng, em rất cảm ơn anh chị đã dành thời gian trao đổi cùng em.",
        "Chúc công ty mình luôn phát triển mạnh mẽ và gặt hái thêm nhiều thành công mới!",
        "Số điện thoại hỗ trợ kỹ thuật khẩn cấp của bên em là 19001234.",
        "Trợ lý ảo thông minh có thể nghe hiểu và phản hồi giọng nói 3 miền Bắc, Trung, Nam một cách trôi chảy.",
        "Hẹn gặp lại quý anh chị trong buổi bàn giao và kích hoạt hệ thống sắp tới ạ!",
        "Xin chào và chúc anh chị một ngày làm việc thật nhiều năng lượng!"
    ]

    # Silence detect via ffmpeg
    cmd = [
        "ffmpeg", "-i", wav_path,
        "-af", "silencedetect=noise=-32dB:d=0.45",
        "-f", "null", "-"
    ]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    
    silences = []
    current_start = 0.0
    for line in res.stderr.split("\n"):
        if "silence_start:" in line:
            parts = line.split("silence_start:")
            try:
                current_start = float(parts[1].strip().split()[0])
            except:
                pass
        elif "silence_end:" in line:
            parts = line.split("silence_end:")
            try:
                end_val = float(parts[1].split("|")[0].strip())
                silences.append((current_start, end_val))
            except:
                pass

    print(f"Detected {len(silences)} silence gaps.")

    # Calculate speech segments
    segments = []
    prev_end = 0.0
    for s_start, s_end in silences:
        if s_start - prev_end > 1.2: # at least 1.2s speech
            segments.append((max(0.0, prev_end - 0.1), min(s_start + 0.1, s_end)))
        prev_end = s_end

    # Last segment
    duration = 120.47
    if duration - prev_end > 1.2:
        segments.append((prev_end, duration))

    print(f"Calculated {len(segments)} candidate speech segments.")

    dataset = []
    # If segments match approximately
    for i, seg in enumerate(segments[:len(sentences)]):
        start, end = seg
        seg_file = f"{out_dir}/bao_seg_{i+1:02d}.wav"
        cut_cmd = [
            "ffmpeg", "-y", "-ss", f"{start:.3f}", "-to", f"{end:.3f}",
            "-i", wav_path, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le",
            "-af", "volume=3.0",
            seg_file
        ]
        subprocess.run(cut_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        text = sentences[i] if i < len(sentences) else ""
        dataset.append({
            "id": f"bao_{i+1:02d}",
            "file": seg_file,
            "text": text,
            "duration": round(end - start, 2)
        })

    with open("voices/dataset.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    # LJSpeech format: filename|text|text
    with open("voices/metadata.txt", "w", encoding="utf-8") as f:
        for item in dataset:
            f.write(f"{os.path.basename(item['file'])}|{item['text']}|{item['text']}\n")

    print(f"Successfully exported {len(dataset)} segmented voice clips into {out_dir}")

if __name__ == "__main__":
    main()
