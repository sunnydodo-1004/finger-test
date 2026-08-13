// ==========================================
// FINGER IQ
// 지문 사진 품질 검사 엔진
// ==========================================

const ImageQuality = {

    // --------------------------------------
    // 이미지 품질 전체 검사
    // --------------------------------------
    analyze: function(file, imageElement) {

        const result = {
            valid: true,
            score: 0,
            sharpness: 0,
            brightness: 0,
            contrast: 0,
            message: "",
            level: "good"
        };

        // 파일 확인
        if (!file || !file.type.startsWith("image/")) {

            return {
                valid: false,
                score: 0,
                message: "이미지 파일이 아닙니다.",
                level: "bad"
            };
        }


        // 이미지가 정상적으로 로드되었는지 확인
        if (
            !imageElement ||
            !imageElement.naturalWidth ||
            !imageElement.naturalHeight
        ) {

            return {
                valid: false,
                score: 0,
                message: "이미지를 읽을 수 없습니다.",
                level: "bad"
            };
        }


        // ----------------------------------
        // 해상도 검사
        // ----------------------------------

        const width =
            imageElement.naturalWidth;

        const height =
            imageElement.naturalHeight;

        const pixels =
            width * height;


        let resolutionScore = 100;


        if (width < 500 || height < 500) {

            resolutionScore = 40;

        } else if (
            width < 800 ||
            height < 800
        ) {

            resolutionScore = 65;

        } else if (
            width < 1200 ||
            height < 1200
        ) {

            resolutionScore = 80;

        }


        // ----------------------------------
        // Canvas 생성
        // ----------------------------------

        const canvas =
            document.createElement("canvas");

        const ctx =
            canvas.getContext("2d");


        // 분석용 크기로 축소
        const analysisSize = 400;

        const ratio =
            Math.min(
                analysisSize / width,
                analysisSize / height
            );


        canvas.width =
            Math.max(1, Math.round(width * ratio));

        canvas.height =
            Math.max(1, Math.round(height * ratio));


        ctx.drawImage(
            imageElement,
            0,
            0,
            canvas.width,
            canvas.height
        );


        const imageData =
            ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );


        const data =
            imageData.data;


        // ----------------------------------
        // 밝기 계산
        // ----------------------------------

        let brightnessSum = 0;

        let contrastSum = 0;

        const brightnessValues = [];


        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            const r = data[i];

            const g = data[i + 1];

            const b = data[i + 2];


            // 인간 시각 기준 밝기
            const brightness =
                0.299 * r +
                0.587 * g +
                0.114 * b;


            brightnessSum += brightness;

            brightnessValues.push(
                brightness
            );

        }


        const pixelCount =
            brightnessValues.length;


        const averageBrightness =
            brightnessSum / pixelCount;


        // 밝기 점수
        let brightnessScore;


        if (
            averageBrightness >= 70 &&
            averageBrightness <= 200
        ) {

            brightnessScore = 100;

        } else if (
            averageBrightness >= 45 &&
            averageBrightness <= 225
        ) {

            brightnessScore = 75;

        } else {

            brightnessScore = 40;

        }


        // ----------------------------------
        // 대비 계산
        // ----------------------------------

        let variance = 0;


        for (
            let i = 0;
            i < brightnessValues.length;
            i++
        ) {

            const diff =
                brightnessValues[i] -
                averageBrightness;

            variance += diff * diff;

        }


        const standardDeviation =
            Math.sqrt(
                variance /
                pixelCount
            );


        if (standardDeviation >= 35) {

            contrastScore = 100;

        } else if (standardDeviation >= 20) {

            contrastScore = 75;

        } else {

            contrastScore = 45;

        }


        // ----------------------------------
        // 간단한 선명도 추정
        // ----------------------------------

        let edgeSum = 0;

        let edgeCount = 0;


        const w =
            canvas.width;

        const h =
            canvas.height;


        // 밝기 배열 만들기
        const gray = new Float32Array(
            w * h
        );


        for (
            let y = 0;
            y < h;
            y++
        ) {

            for (
                let x = 0;
                x < w;
                x++
            ) {

                const index =
                    (y * w + x) * 4;

                const r =
                    data[index];

                const g =
                    data[index + 1];

                const b =
                    data[index + 2];


                gray[y * w + x] =
                    0.299 * r +
                    0.587 * g +
                    0.114 * b;

            }

        }


        // 인접 픽셀 차이를 이용한 선명도 추정
        for (
            let y = 1;
            y < h - 1;
            y++
        ) {

            for (
                let x = 1;
                x < w - 1;
                x++
            ) {

                const center =
                    gray[y * w + x];

                const right =
                    gray[y * w + x + 1];

                const bottom =
                    gray[(y + 1) * w + x];


                const horizontal =
                    Math.abs(
                        center - right
                    );

                const vertical =
                    Math.abs(
                        center - bottom
                    );


                edgeSum +=
                    horizontal +
                    vertical;

                edgeCount++;

            }

        }


        const edgeAverage =
            edgeSum / edgeCount;


        let sharpnessScore;


        if (edgeAverage >= 25) {

            sharpnessScore = 100;

        } else if (edgeAverage >= 15) {

            sharpnessScore = 80;

        } else if (edgeAverage >= 8) {

            sharpnessScore = 60;

        } else {

            sharpnessScore = 35;

        }


        // ----------------------------------
        // 최종 점수
        // ----------------------------------

        const finalScore =
            Math.round(

                resolutionScore * 0.25 +
                brightnessScore * 0.25 +
                contrastScore * 0.20 +
                sharpnessScore * 0.30

            );


        result.score =
            finalScore;

        result.sharpness =
            sharpnessScore;

        result.brightness =
            brightnessScore;

        result.contrast =
            contrastScore;


        // ----------------------------------
        // 결과 판정
        // ----------------------------------

        if (finalScore >= 80) {

            result.level = "good";

            result.message =
                "촬영 상태가 양호합니다. 지문 분석에 사용할 수 있습니다.";

        } else if (finalScore >= 60) {

            result.level = "warning";

            result.message =
                "촬영 상태가 보통입니다. 가능하면 조금 더 선명하게 다시 촬영해주세요.";

        } else {

            result.level = "bad";

            result.message =
                "사진이 불분명합니다. 지문 융선이 선명하게 보이도록 다시 촬영해주세요.";

        }


        return result;

    }

};