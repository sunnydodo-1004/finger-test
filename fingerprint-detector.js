// ==========================================
// FINGER IQ
// Fingerprint Detector 5.3 — NIST-aligned pattern classes
// Multi-ROI ridge search + orientation-field classifier
// ==========================================

const FingerprintDetector = (() => {

    function sourceCanvas(image) {
        const maxSize = 720;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return { canvas, ctx };
    }

    function grayFromImageData(imageData) {
        const src = imageData.data;
        const gray = new Float32Array(imageData.width * imageData.height);
        for (let i = 0; i < gray.length; i++) {
            const p = i * 4;
            gray[i] = 0.299 * src[p] + 0.587 * src[p + 1] + 0.114 * src[p + 2];
        }
        return gray;
    }

    function stats(gray) {
        let sum = 0;
        for (const v of gray) sum += v;
        const mean = sum / gray.length;
        let variance = 0;
        for (const v of gray) {
            const d = v - mean;
            variance += d * d;
        }
        return { mean, std: Math.sqrt(variance / gray.length) };
    }

    function roiCanvas(source, fraction, ox = 0, oy = 0) {
        const { canvas } = source;
        const size = Math.floor(Math.min(canvas.width, canvas.height) * fraction);
        const cx = canvas.width / 2 + ox * canvas.width;
        const cy = canvas.height / 2 + oy * canvas.height;
        let sx = Math.round(cx - size / 2);
        let sy = Math.round(cy - size / 2);
        sx = Math.max(0, Math.min(canvas.width - size, sx));
        sy = Math.max(0, Math.min(canvas.height - size, sy));

        const out = document.createElement("canvas");
        out.width = size;
        out.height = size;
        const ctx = out.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(canvas, sx, sy, size, size, 0, 0, size, size);
        return { canvas: out, ctx, fraction, sx, sy };
    }

    function orientationField(gray, width, height) {
        const block = Math.max(14, Math.floor(Math.min(width, height) / 10));
        const blocks = [];
        let coherent = 0;
        let usable = 0;
        let strong = 0;
        let samples = 0;
        let edgeSum = 0;

        for (let by = 0; by + block < height; by += block) {
            for (let bx = 0; bx + block < width; bx += block) {
                let vx = 0, vy = 0, energy = 0, localStrong = 0, localN = 0;

                for (let y = by + 1; y < by + block - 1; y += 2) {
                    for (let x = bx + 1; x < bx + block - 1; x += 2) {
                        const i = y * width + x;
                        const gx = gray[i + 1] - gray[i - 1];
                        const gy = gray[i + width] - gray[i - width];
                        const mag = Math.sqrt(gx * gx + gy * gy);
                        const mag2 = gx * gx + gy * gy;

                        edgeSum += mag;
                        samples++;
                        localN++;
                        if (mag > 12) {
                            strong++;
                            localStrong++;
                        }

                        energy += mag2;
                        vx += gx * gx - gy * gy;
                        vy += 2 * gx * gy;
                    }
                }

                if (energy < 1) continue;
                usable++;

                const coherence = Math.sqrt(vx * vx + vy * vy) / energy;
                if (coherence >= 0.25) coherent++;

                blocks.push({
                    x: bx + block / 2,
                    y: by + block / 2,
                    angle: 0.5 * Math.atan2(vy, vx),
                    coherence,
                    strongRatio: localN ? localStrong / localN : 0
                });
            }
        }

        return {
            blocks,
            coherenceRatio: usable ? coherent / usable : 0,
            strongRatio: samples ? strong / samples : 0,
            edgeMean: samples ? edgeSum / samples : 0
        };
    }

    function circularVariation(blocks, width, height, radiusFraction = 0.34) {
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * radiusFraction;
        const chosen = blocks.filter(b => {
            const dx = b.x - cx, dy = b.y - cy;
            return Math.hypot(dx, dy) <= radius && b.coherence >= 0.18;
        });
        if (chosen.length < 5) return { variation: 0, count: chosen.length };

        let sx = 0, cxv = 0;
        for (const b of chosen) {
            sx += Math.sin(2 * b.angle);
            cxv += Math.cos(2 * b.angle);
        }
        const resultant = Math.hypot(sx, cxv) / chosen.length;
        return { variation: 1 - resultant, count: chosen.length };
    }

    function curvatureScore(blocks, width, height) {
        const cx = width / 2, cy = height / 2;
        const chosen = blocks
            .filter(b => b.coherence >= 0.22)
            .map(b => ({
                ...b,
                r: Math.hypot(b.x - cx, b.y - cy)
            }))
            .filter(b => b.r < Math.min(width, height) * 0.42);

        if (chosen.length < 6) return 0;

        let total = 0, pairs = 0;
        for (let i = 0; i < chosen.length; i++) {
            for (let j = i + 1; j < chosen.length; j++) {
                const a = chosen[i], b = chosen[j];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist > Math.min(width, height) * 0.22) continue;

                let d = Math.abs(a.angle - b.angle);
                while (d > Math.PI / 2) d = Math.abs(d - Math.PI);
                total += d / (Math.PI / 2);
                pairs++;
            }
        }
        return pairs ? total / pairs : 0;
    }

    function evaluateROI(roi) {
        const imageData = roi.ctx.getImageData(0, 0, roi.canvas.width, roi.canvas.height);
        const gray = grayFromImageData(imageData);
        const st = stats(gray);
        const field = orientationField(gray, roi.canvas.width, roi.canvas.height);
        const center = circularVariation(field.blocks, roi.canvas.width, roi.canvas.height);
        const curvature = curvatureScore(field.blocks, roi.canvas.width, roi.canvas.height);

        // Fingerprint-likeness: repeated fine edges + coherent local orientations.
        // This is intentionally not a hard "photo sharpness" score.
        const ridgeScore = Math.round(Math.max(0, Math.min(100,
            field.strongRatio * 115 +
            field.coherenceRatio * 55 +
            Math.min(1, field.edgeMean / 20) * 22 +
            Math.min(1, st.std / 45) * 8
        )));

        return {
            roi,
            st,
            field,
            centerVariation: center.variation,
            centerCount: center.count,
            curvature,
            ridgeScore
        };
    }

    function chooseBestROI(source) {
        // Search several scales and small offsets so the user does not have to
        // place the fingertip at an exact pixel location.
        const specs = [
            [0.42, 0, 0], [0.52, 0, 0], [0.62, 0, 0], [0.72, 0, 0],
            [0.52, 0, -0.08], [0.52, 0, 0.08],
            [0.52, -0.08, 0], [0.52, 0.08, 0],
            [0.62, 0, -0.07], [0.62, 0, 0.07]
        ];

        const evaluated = specs.map(s => evaluateROI(roiCanvas(source, ...s)));

        evaluated.sort((a, b) => {
            const scoreA = a.ridgeScore + a.field.coherenceRatio * 18;
            const scoreB = b.ridgeScore + b.field.coherenceRatio * 18;
            return scoreB - scoreA;
        });

        return evaluated[0];
    }

    function classify(best) {
        const v = best.centerVariation;
        const c = best.curvature;
        const coherence = best.field.coherenceRatio;

        // NIST general pattern families:
        // Arch (plain/tented), Loop (left/right slant), Whorl.
        // This browser implementation estimates these from the orientation field.
        // It does NOT claim examiner-grade core/delta detection.
        let arch = 8;
        let tented = 8;
        let loop = 8;
        let whorl = 8;

        if (v < 0.14) arch += 42;
        else if (v < 0.24) { arch += 24; tented += 16; loop += 10; }
        else if (v < 0.43) loop += 38;
        else whorl += 38;

        if (c < 0.15) arch += 24;
        else if (c < 0.27) { tented += 20; loop += 14; }
        else if (c < 0.39) loop += 20;
        else whorl += 24;

        if (coherence > 0.72 && v < 0.22) arch += 10;
        if (v >= 0.18 && v <= 0.31 && c >= 0.18 && c <= 0.31) tented += 16;
        if (v >= 0.25 && v <= 0.48) loop += 14;
        if (v > 0.44 && c > 0.31) whorl += 18;

        const list = [
            { pattern: "ARCH", label: "평아치형 후보", score: arch },
            { pattern: "TENTED_ARCH", label: "텐트형 아치 후보", score: tented },
            { pattern: "LOOP", label: "루프형 후보", score: loop },
            { pattern: "WHORL", label: "소용돌이형 후보", score: whorl }
        ].sort((a, b) => b.score - a.score);

        const total = list.reduce((sum, x) => sum + Math.max(0, x.score), 0) || 1;
        const probabilities = {};
        for (const item of list) {
            probabilities[item.pattern] =
                Math.round((Math.max(0, item.score) / total) * 100);
        }

        return {
            first: list[0],
            second: list[1],
            candidates: list,
            scores: {
                ARCH: arch,
                TENTED_ARCH: tented,
                LOOP: loop,
                WHORL: whorl
            },
            probabilities
        };
    }

    function analyze(image) {
        if (!image || !image.naturalWidth) {
            return {
                success: false,
                pattern: "UNKNOWN",
                label: "판독 불가",
                confidence: 0,
                reason: "이미지를 분석할 수 없습니다."
            };
        }

        const source = sourceCanvas(image);
        const best = chooseBestROI(source);
        const classified = classify(best);
        const margin = classified.first.score - classified.second.score;

        const debug = {
            roi: `${best.roi.canvas.width}×${best.roi.canvas.height}`,
            roiScale: best.roi.fraction,
            brightness: Math.round(best.st.mean),
            contrast: Math.round(best.st.std),
            edgeMean: Math.round(best.field.edgeMean * 10) / 10,
            ridgeEdgeRatio: Math.round(best.field.strongRatio * 1000) / 1000,
            coherence: Math.round(best.field.coherenceRatio * 1000) / 1000,
            centerVariation: Math.round(best.centerVariation * 1000) / 1000,
            curvature: Math.round(best.curvature * 1000) / 1000,
            ridgeScore: best.ridgeScore,
            scores: classified.scores,
            probabilities: classified.probabilities
        };

        // 5.1: 먼저 "유형 분류가 가능한 크기의 실제 융선 구조"가 있는지 확인.
        // 배경 경계/손가락 외곽선이 강해도, 충분한 미세 융선이 없으면 분류하지 않는다.
        const usableRidgeArea =
            best.field.blocks.filter(
                b =>
                    b.coherence >= 0.28 &&
                    b.strongRatio >= 0.08
            ).length;

        const totalBlocks =
            Math.max(1, best.field.blocks.length);

        const usableRidgeRatio =
            usableRidgeArea / totalBlocks;

        debug.usableRidgeRatio =
            Math.round(usableRidgeRatio * 1000) / 1000;

        const fingerprintTooSmall =
            usableRidgeRatio < 0.24 ||
            (
                best.field.coherenceRatio < 0.32 &&
                best.field.strongRatio < 0.05
            );

        if (fingerprintTooSmall) {

            const likelyBlurred =
                best.field.coherenceRatio >= 0.55 &&
                usableRidgeRatio < 0.24;

            return {
                success: true,
                pattern: "UNKNOWN",
                label:
                    likelyBlurred
                        ? "지문에 초점을 맞춰주세요"
                        : "손끝을 더 크게 촬영해주세요",
                confidence: 0,
                reason:
                    likelyBlurred
                        ? "손끝 크기는 충분하지만 지문의 가느다란 선이 선명하게 보이지 않습니다. 카메라 초점을 손끝에 맞춰 다시 촬영해주세요."
                        : "지문 유형을 판별하기에는 손끝의 지문 영역이 작습니다. 예시처럼 손끝을 화면에 더 크게 촬영해주세요.",
                ridgeDetected: false,
                tooSmall: !likelyBlurred,
                focusIssue: likelyBlurred,
                fallbackCandidate: null,
                debug,
                image: {
                    width: best.roi.canvas.width,
                    height: best.roi.canvas.height,
                    brightness: Math.round(best.st.mean),
                    contrast: Math.round(best.st.std)
                }
            };
        }

        // Only truly weak images are blocked. Borderline images can proceed
        // with a low-confidence label.
        const clearlyWeak =
            best.ridgeScore < 27 ||
            best.field.coherenceRatio < 0.11 ||
            best.field.strongRatio < 0.018;

        if (clearlyWeak) {
            return {
                success: true,
                pattern: "UNKNOWN",
                label: "지문 확인 필요",
                confidence: Math.min(40, best.ridgeScore),
                reason:
                    "지문 선 구조가 충분히 확인되지 않습니다. 가능하면 손끝을 더 선명하게 촬영해주세요.",
                ridgeDetected: false,
                fallbackCandidate: classified.first.pattern,
                debug,
                image: {
                    width: best.roi.canvas.width,
                    height: best.roi.canvas.height,
                    brightness: Math.round(best.st.mean),
                    contrast: Math.round(best.st.std)
                }
            };
        }

        const ambiguous =
            classified.first.score < 42 ||
            margin < 12;

        if (ambiguous) {
            return {
                success: true,
                pattern: "UNKNOWN",
                label: "유형 판독 보류",
                confidence: Math.min(58, Math.max(35, 42 + margin)),
                reason:
                    "지문 융선은 확인되지만 세 유형의 차이가 작습니다. 재촬영 없이 진행하면 가장 가까운 후보를 낮은 신뢰도로 사용합니다.",
                ridgeDetected: true,
                fallbackCandidate: classified.first.pattern,
                debug,
                image: {
                    width: best.roi.canvas.width,
                    height: best.roi.canvas.height,
                    brightness: Math.round(best.st.mean),
                    contrast: Math.round(best.st.std)
                }
            };
        }

        const confidence = Math.min(78, Math.max(52, Math.round(48 + margin * 0.9)));
        const reasons = {
            ARCH: "선택된 영역에서 비교적 완만하고 일관된 융선 흐름이 관찰됩니다.",
            TENTED_ARCH: "선택된 영역에서 아치형 흐름과 중앙부의 비교적 급한 방향 변화가 함께 관찰됩니다.",
            LOOP: "선택된 영역에서 되굽는 형태를 시사하는 중간 수준의 방향 변화와 곡률이 관찰됩니다.",
            WHORL: "선택된 영역의 중심부에서 큰 방향 변화와 곡률이 관찰됩니다."
        };

        return {
            success: true,
            pattern: classified.first.pattern,
            label: classified.first.label,
            confidence,
            reason: reasons[classified.first.pattern],
            ridgeDetected: true,
            fallbackCandidate: classified.first.pattern,
            debug,
            image: {
                width: best.roi.canvas.width,
                height: best.roi.canvas.height,
                brightness: Math.round(best.st.mean),
                contrast: Math.round(best.st.std)
            }
        };
    }

    return { analyze };
})();
