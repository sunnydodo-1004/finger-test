// ==========================================
// FINGER IQ
// 지문 카메라 촬영 시스템
// ==========================================



// ==========================================
// 접속 비밀번호
// ==========================================

// GitHub Pages 같은 정적 사이트에서는 이 비밀번호가 소스코드에 포함됩니다.
// 강한 보안 기능이 아니라 허용 사용자용 간단한 입장 제한 기능입니다.
const ACCESS_PASSWORD = "finger1004";

const passwordGate =
    document.getElementById("passwordGate");

const accessPasswordInput =
    document.getElementById("accessPassword");

const passwordEnterBtn =
    document.getElementById("passwordEnterBtn");

const passwordError =
    document.getElementById("passwordError");

function unlockApp() {

    const entered =
        accessPasswordInput.value;

    if (entered === ACCESS_PASSWORD) {

        sessionStorage.setItem(
            "fingerIQUnlocked",
            "yes"
        );

        passwordGate.style.display =
            "none";

        passwordError.textContent =
            "";

        return;
    }

    passwordError.textContent =
        "비밀번호가 올바르지 않습니다.";

    accessPasswordInput.focus();
}

if (
    sessionStorage.getItem(
        "fingerIQUnlocked"
    ) === "yes"
) {

    passwordGate.style.display =
        "none";
}

passwordEnterBtn.addEventListener(
    "click",
    unlockApp
);

accessPasswordInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            unlockApp();
        }
    }
);


// 10개 손가락 순서
const fullFingers = [

    {
        hand: "왼손",
        name: "엄지",
        key: "left_thumb"
    },

    {
        hand: "왼손",
        name: "검지",
        key: "left_index"
    },

    {
        hand: "왼손",
        name: "중지",
        key: "left_middle"
    },

    {
        hand: "왼손",
        name: "약지",
        key: "left_ring"
    },

    {
        hand: "왼손",
        name: "새끼",
        key: "left_little"
    },

    {
        hand: "오른손",
        name: "엄지",
        key: "right_thumb"
    },

    {
        hand: "오른손",
        name: "검지",
        key: "right_index"
    },

    {
        hand: "오른손",
        name: "중지",
        key: "right_middle"
    },

    {
        hand: "오른손",
        name: "약지",
        key: "right_ring"
    },

    {
        hand: "오른손",
        name: "새끼",
        key: "right_little"
    }

];


const simpleFingerKeys = [
    "left_thumb","left_index","right_thumb","right_index"
];

let fingers = [...fullFingers];
let testMode = "simple";

// 현재 손가락
let currentIndex = 0;


// 검사자
let participant = {

    name: "",
    birth: "",
    consultant: ""

};


// 지문 데이터
let fingerprintImages = {};

// 동일 손가락 2회 판독 비교
let repeatCaptures = {};
function requiredCapturesPerFinger() {
    return 1;
}


// ==========================================
// HTML 요소
// ==========================================

const startScreen =
    document.getElementById("startScreen");

const fingerScreen =
    document.getElementById("fingerScreen");

const completeScreen =
    document.getElementById("completeScreen");

const resultScreen =
    document.getElementById("resultScreen");

const resultParticipant =
    document.getElementById("resultParticipant");

const top3Results =
    document.getElementById("top3Results");

const intelligenceResults =
    document.getElementById("intelligenceResults");

const learningStyleResult =
    document.getElementById("learningStyleResult");

const fingerPatternResults =
    document.getElementById("fingerPatternResults");

const restartBtn =
    document.getElementById("restartBtn");

const pdfBtn =
    document.getElementById("pdfBtn");


const nameInput =
    document.getElementById("name");

const birthInput =
    document.getElementById("birth");

const consultantInput =
    document.getElementById("consultant");


const startBtn =
    document.getElementById("startBtn");


const currentNumber =
    document.getElementById("currentNumber");

const totalNumber =
    document.getElementById("totalNumber");

const progress =
    document.getElementById("progress");


const handLabel =
    document.getElementById("handLabel");

const fingerName =
    document.getElementById("fingerName");


const cameraBtn =
    document.getElementById("cameraBtn");

const cameraInput =
    document.getElementById("cameraInput");


const galleryBtn =
    document.getElementById("galleryBtn");

const galleryInput =
    document.getElementById("galleryInput");


const previewArea =
    document.getElementById("previewArea");


const photoActions =
    document.getElementById("photoActions");


const retakeBtn =
    document.getElementById("retakeBtn");


const usePhotoBtn =
    document.getElementById("usePhotoBtn");


const nextBtn =
    document.getElementById("nextBtn");


const analysisBtn =
    document.getElementById("analysisBtn");


totalNumber.textContent =
    fingers.length;


// ==========================================
// 화면 전환
// ==========================================

function showScreen(screen) {

    startScreen.classList.remove("active");

    fingerScreen.classList.remove("active");

    completeScreen.classList.remove("active");

    resultScreen.classList.remove("active");

    screen.classList.add("active");

}


// ==========================================
// 검사 시작
// ==========================================

startBtn.addEventListener(
    "click",
    function () {

        const name =
            nameInput.value.trim();


        if (!name) {

            alert(
                "검사자 이름을 입력해주세요."
            );

            nameInput.focus();

            return;

        }


        participant.name =
            name;

        participant.birth =
            birthInput.value;

        participant.consultant =
            consultantInput.value.trim();


        const selectedMode =
            document.querySelector('input[name="testMode"]:checked');

        testMode = selectedMode ? selectedMode.value : "simple";
        fingers =
            testMode === "simple"
                ? fullFingers.filter(f => simpleFingerKeys.includes(f.key))
                : [...fullFingers];

        currentIndex = 0;
        fingerprintImages = {};
        repeatCaptures = {};

        showScreen(fingerScreen);

        loadFinger();

    }
);


// ==========================================
// 현재 손가락 표시
// ==========================================

function loadFinger() {

    const finger =
        fingers[currentIndex];


    handLabel.textContent =
        finger.hand;


    const repeatCount =
        repeatCaptures[finger.key]
            ? repeatCaptures[finger.key].length
            : 0;

    fingerName.innerHTML =
        `${finger.hand} ${finger.name} 지문
         <div class="repeat-capture-status">
            반복 촬영 ${Math.min(repeatCount + 1, requiredCapturesPerFinger())}
            / ${requiredCapturesPerFinger()}
         </div>`;


    currentNumber.textContent =
        currentIndex + 1;


    const percent =
        ((currentIndex + 1)
        / fingers.length) * 100;


    progress.style.width =
        `${percent}%`;


    previewArea.innerHTML =
        "촬영한 지문이 여기에 표시됩니다.";


    photoActions.style.display =
        "none";


    nextBtn.disabled =
        true;


    cameraInput.value =
        "";

    galleryInput.value =
        "";

}


// ==========================================
// 카메라 실행
// ==========================================

cameraBtn.addEventListener(
    "click",
    function () {

        cameraInput.click();

    }
);


// ==========================================
// 사진 선택
// ==========================================

galleryBtn.addEventListener(
    "click",
    function () {

        galleryInput.click();

    }
);


// ==========================================
// 카메라 사진 처리
// ==========================================

cameraInput.addEventListener(
    "change",
    function (event) {

        handlePhoto(event);

    }
);


// ==========================================
// 갤러리 사진 처리
// ==========================================

galleryInput.addEventListener(
    "change",
    function (event) {

        handlePhoto(event);

    }
);


// ==========================================
// 사진 처리 함수
// ==========================================

function handlePhoto(event) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    if (!file.type.startsWith("image/")) {

        alert(
            "이미지 파일만 사용할 수 있습니다."
        );

        return;

    }


    const reader =
        new FileReader();

reader.onload =
    function (e) {

        previewArea.innerHTML = "";

        const img =
            document.createElement("img");

        img.src =
            e.target.result;

        previewArea.appendChild(img);


        // 이미지가 실제로 로드된 후 품질 검사
        img.onload = function () {

            const quality =
                ImageQuality.analyze(
                    file,
                    img
                );
         const fingerprint =
    FingerprintDetector.analyze(
        img
    );
            // 품질 결과 표시
            const qualityBox =
                document.createElement("div");

            qualityBox.className =
                "quality-result";


            let icon = "⚠️";

            if (quality.level === "good") {

                icon = "✅";

            } else if (
                quality.level === "bad"
            ) {

                icon = "❌";

            }


            qualityBox.innerHTML = `

                <div class="quality-icon">
                    ${icon}
                </div>

                <div class="quality-title">
                    사진 품질 점수
                    ${quality.score}점
                </div>

                <div class="quality-message">
                    ${quality.message}
                </div>

                <div class="quality-details">

                    선명도 ${quality.sharpness} ·
                    밝기 ${quality.brightness} ·
                    대비 ${quality.contrast}

                </div>

            `;


            previewArea.appendChild(
                qualityBox
            );
const fingerprintBox =
    document.createElement("div");

fingerprintBox.className =
    "fingerprint-result";

fingerprintBox.innerHTML = `

    <div class="fingerprint-title">
        🔍 지문 패턴 자동 추정
    </div>

    <div class="fingerprint-pattern">
        ${fingerprint.label}
    </div>

    <div class="fingerprint-confidence">
        추정 신뢰도 ${fingerprint.confidence}%
    </div>

    <div class="fingerprint-reason">
        ${fingerprint.reason}
    </div>

    ${
        fingerprint.pattern === "UNKNOWN" &&
        fingerprint.tooSmall !== true &&
        fingerprint.focusIssue !== true
            ? `
                <div class="fingerprint-warning">
                    재촬영 없이 진행할 수도 있습니다.
                    이 경우 가장 가까운 유형으로 낮은 신뢰도로 임시 분류합니다.
                </div>
              `
            : ""
    }

    ${
        fingerprint.debug
            ? `
                <div class="fingerprint-debug">
                    융선점수 ${fingerprint.debug.ridgeScore ?? "-"} ·
                    방향일관성 ${fingerprint.debug.coherence ?? "-"} ·
                    중심변화 ${fingerprint.debug.centerVariation ?? "-"} ·
                    곡률 ${fingerprint.debug.curvature ?? "-"} ·
                    유효융선 ${fingerprint.debug.usableRidgeRatio ?? "-"} ·
                    ROI ${fingerprint.debug.roiScale ?? "-"}
                    ${
                        fingerprint.debug.scores
                            ? `<br>후보비율
                               평아치 ${fingerprint.debug.probabilities?.ARCH ?? "-"}% /
                               텐트아치 ${fingerprint.debug.probabilities?.TENTED_ARCH ?? "-"}% /
                               루프 ${fingerprint.debug.probabilities?.LOOP ?? "-"}% /
                               소용돌이 ${fingerprint.debug.probabilities?.WHORL ?? "-"}%`
                            : ""
                    }
                </div>
              `
            : ""
    }

`;

previewArea.appendChild(
    fingerprintBox
);

            // 데이터 저장
            const finger =
                fingers[currentIndex];


            fingerprintImages[
    finger.key
] = {

    file: file,

    dataUrl:
        e.target.result,

    confirmed: false,

    quality:
        quality,

    detection:
        fingerprint

};

            if (!repeatCaptures[finger.key]) {
                repeatCaptures[finger.key] = [];
            }

            repeatCaptures[finger.key].push({
                dataUrl: e.target.result,
                quality,
                detection: fingerprint
            });

            if (repeatCaptures[finger.key].length > requiredCapturesPerFinger()) {
                repeatCaptures[finger.key] =
                    repeatCaptures[finger.key].slice(-requiredCapturesPerFinger());
            }

            photoActions.style.display =
                "flex";


            // 품질이 너무 낮으면
            // 사용 버튼 비활성화
            if (
                quality.level === "bad" ||
                fingerprint.tooSmall === true ||
                fingerprint.focusIssue === true
            ) {

                usePhotoBtn.disabled =
                    true;

                usePhotoBtn.style.opacity =
                    "0.5";

            } else {

                usePhotoBtn.disabled =
                    false;

                usePhotoBtn.style.opacity =
                    "1";

            }


            nextBtn.disabled =
                true;

        };

    };
    

    reader.readAsDataURL(file);

}


// ==========================================
// 다시 촬영
// ==========================================

retakeBtn.addEventListener(
    "click",
    function () {

        const finger =
            fingers[currentIndex];


        delete fingerprintImages[
            finger.key
        ];

        // 사용자가 "다시 촬영"을 누른 경우 방금 촬영값만 제거
        if (repeatCaptures[finger.key]?.length) {
            repeatCaptures[finger.key].pop();
        }


        previewArea.innerHTML =
            "촬영한 지문이 여기에 표시됩니다.";


        photoActions.style.display =
            "none";


        nextBtn.disabled =
            true;


        cameraInput.value =
            "";


        galleryInput.value =
            "";


        // 바로 카메라 실행
        cameraInput.click();

    }
);


// ==========================================
// 사진 사용
// ==========================================

usePhotoBtn.addEventListener(
    "click",
    function () {

        const finger =
            fingers[currentIndex];

        const samples = repeatCaptures[finger.key] || [];

        if (samples.length < requiredCapturesPerFinger()) {
            alert(
                `${finger.hand} ${finger.name}을 한 번 더 촬영해주세요.\n간편검사는 각 손가락을 1회 촬영합니다.`
            );

            // 첫 촬영은 보관하고 화면만 다음 촬영 상태로 초기화
            previewArea.innerHTML = "두 번째 촬영을 진행해주세요.";
            photoActions.style.display = "none";
            nextBtn.disabled = true;
            cameraInput.value = "";
            galleryInput.value = "";
            loadFinger();
            return;
        }

        const resolved = samples.map(sample => {
            const d = sample.detection || {};
            return d.effectivePattern ||
                   (d.pattern && d.pattern !== "UNKNOWN" ? d.pattern : null) ||
                   d.fallbackCandidate ||
                   null;
        });

        const agreement =
            resolved.length >= 1 &&
            !!resolved[0];

        if (!agreement) {
            repeatCaptures[finger.key] = [];
            delete fingerprintImages[finger.key];

            alert(
                `${finger.hand} ${finger.name}의 두 번 판독 결과가 서로 다릅니다.\n같은 손가락을 다시 2회 촬영해주세요.`
            );

            previewArea.innerHTML = "촬영한 지문이 여기에 표시됩니다.";
            photoActions.style.display = "none";
            nextBtn.disabled = true;
            cameraInput.value = "";
            galleryInput.value = "";
            loadFinger();
            return;
        }

        fingerprintImages[finger.key].detection.effectivePattern = resolved[0];
        fingerprintImages[finger.key].detection.usedConsensus = true;
        fingerprintImages[finger.key].detection.agreementLabel =
            "1회 판독";


        if (!fingerprintImages[
            finger.key
        ]) {

            return;

        }


        const storedImage =
            fingerprintImages[
                finger.key
            ];

        storedImage.confirmed = true;

        if (
            storedImage.detection &&
            storedImage.detection.pattern === "UNKNOWN"
        ) {

            storedImage.detection.effectivePattern =
                storedImage.detection.fallbackCandidate ||
                (
                    storedImage.detection.debug &&
                    storedImage.detection.debug.scores
                        ? Object.entries(
                            storedImage.detection.debug.scores
                          ).sort(
                            (a, b) => b[1] - a[1]
                          )[0][0]
                        : "LOOP"
                );

            storedImage.detection.usedFallback =
                true;
        }


        photoActions.style.display =
            "none";


        nextBtn.disabled =
            false;


        previewArea.style.border =
            "1px solid #aaa";

    }
);


// ==========================================
// 다음 손가락
// ==========================================

nextBtn.addEventListener(
    "click",
    function () {

        const finger =
            fingers[currentIndex];


        const image =
            fingerprintImages[
                finger.key
            ];


        if (!image || !image.confirmed) {

            alert(
                "사진을 확인한 후 '이 사진 사용'을 눌러주세요."
            );

            return;

        }


        // 마지막 손가락
        if (
            currentIndex ===
            fingers.length - 1
        ) {

            showScreen(
                completeScreen
            );

            return;

        }


        currentIndex++;

        loadFinger();

    }
);


// ==========================================
// 분석 시작
// ==========================================

analysisBtn.addEventListener(
    "click",
    function () {

        const fingerprintData = {};

        for (const finger of fingers) {

            const imageData =
                fingerprintImages[finger.key];

            if (
                !imageData ||
                !imageData.confirmed ||
                !imageData.detection
            ) {

                alert(
                    "모든 지문이 정상적으로 등록되었는지 확인해주세요."
                );

                return;
            }

            const pattern =
                imageData.detection.effectivePattern ||
                imageData.detection.pattern;

            if (!pattern) {

                alert(
                    `${finger.hand} ${finger.name} 지문 데이터가 없습니다.`
                );

                return;
            }

            fingerprintData[finger.key] =
                pattern;
        }

        const result =
            FingerprintEngine.analyze(
                fingerprintData
            );

        renderResult(
            result,
            fingerprintData
        );

        showScreen(
            resultScreen
        );
    }
);




// ==========================================
// v7 성향별 컬러 / 상세 인간관계 가이드
// ==========================================
const REPORT_THEME = {
    linguistic: "theme-violet",
    logical: "theme-blue",
    spatial: "theme-indigo",
    bodily: "theme-red",
    musical: "theme-rose",
    interpersonal: "theme-orange",
    intrapersonal: "theme-teal",
    naturalistic: "theme-green"
};

const RELATIONSHIP_DETAIL = {
    linguistic: {
        conflict: "갈등이 생기면 설명을 많이 하거나 자신의 의도를 논리적으로 풀어내려는 경향이 나타날 수 있습니다.",
        otherNeeds: "상대는 설명보다 먼저 공감이나 짧은 반응을 원할 수 있습니다.",
        practice: "① 상대 말을 끝까지 듣기 ② 핵심 감정 한 문장으로 확인하기 ③ 해결책은 상대가 원할 때 제안하기",
        phrase: "“내가 이해한 게 맞는지 먼저 확인해볼게.”"
    },
    logical: {
        conflict: "갈등 상황에서도 사실·원인·해결책을 먼저 찾으려 할 수 있어 상대에게 냉정하게 느껴질 수 있습니다.",
        otherNeeds: "상대는 문제 해결보다 자신의 감정이 인정받았다는 느낌을 먼저 원할 수 있습니다.",
        practice: "① 옳고 그름 판단을 잠시 미루기 ② 감정을 먼저 확인하기 ③ 해결책은 선택지 형태로 제안하기",
        phrase: "“해결책보다 지금 네 마음부터 들어볼게.”"
    },
    spatial: {
        conflict: "머릿속에서 전체 그림을 빠르게 그리기 때문에 상대가 세부 설명을 따라오지 못하면 답답함을 느낄 수 있습니다.",
        otherNeeds: "상대에게는 중간 과정과 구체적 예시가 더 필요할 수 있습니다.",
        practice: "① 결론만 말하지 않기 ② 예시를 하나 들기 ③ 상대가 이해한 내용을 다시 말해보게 하기",
        phrase: "“내가 생각한 그림을 단계별로 설명해볼게.”"
    },
    bodily: {
        conflict: "대화보다 행동으로 빨리 해결하려는 경향이 있어 상대가 충분히 이야기하지 못했다고 느낄 수 있습니다.",
        otherNeeds: "상대는 행동 전에 충분한 설명과 동의를 원할 수 있습니다.",
        practice: "① 바로 행동하기 전 10초 멈추기 ② 상대 의사 확인하기 ③ 속도를 맞추기",
        phrase: "“바로 움직이기 전에 네 생각부터 들을게.”"
    },
    musical: {
        conflict: "상대의 말투나 분위기 변화에 민감하게 반응하여 실제 의도보다 크게 받아들일 수 있습니다.",
        otherNeeds: "상대는 단순히 피곤하거나 집중이 흐트러진 것일 수도 있습니다.",
        practice: "① 분위기와 사실을 구분하기 ② 추측 대신 질문하기 ③ 혼자 의미를 확대하지 않기",
        phrase: "“내가 이렇게 느꼈는데, 네 의도는 어땠는지 궁금해.”"
    },
    interpersonal: {
        conflict: "관계를 깨뜨리고 싶지 않아 자신의 불편함을 참다가 한꺼번에 지치거나 서운해질 수 있습니다.",
        otherNeeds: "상대는 명확한 기준을 알려줘야 오히려 관계를 편하게 유지할 수 있습니다.",
        practice: "① 작은 불편함부터 말하기 ② 거절을 관계 단절로 생각하지 않기 ③ 책임 범위를 구분하기",
        phrase: "“도와주고 싶지만 여기까지는 내가 하기 어려워.”"
    },
    intrapersonal: {
        conflict: "감정이나 생각을 혼자 충분히 정리한 뒤 말하려 하여 상대에게는 갑자기 거리를 두는 것처럼 보일 수 있습니다.",
        otherNeeds: "상대는 이유를 모르는 침묵보다 짧은 설명을 원할 수 있습니다.",
        practice: "① 혼자 있을 시간이 필요하다고 알리기 ② 정리가 끝날 시간을 약속하기 ③ 완벽한 문장보다 현재 감정을 짧게 말하기",
        phrase: "“조금 정리할 시간이 필요해. 오늘 안에 다시 이야기할게.”"
    },
    naturalistic: {
        conflict: "세부적인 차이와 오류를 빨리 발견해 상대의 큰 의도보다 수정할 부분을 먼저 말할 수 있습니다.",
        otherNeeds: "상대는 자신의 노력이나 전체 방향이 인정받기를 원할 수 있습니다.",
        practice: "① 잘된 점을 먼저 말하기 ② 수정 포인트는 1~2개로 제한하기 ③ 전체 목적과 연결해서 제안하기",
        phrase: "“전체 방향은 좋아. 한두 가지만 같이 다듬어보자.”"
    }
};

// ==========================================
// v6 상세 결과 콘텐츠
// ==========================================
const REPORT_INFO = {
    linguistic:{strength:"말과 글로 생각을 정리하고 핵심을 전달하는 활동에서 강점을 활용하기 좋습니다.",careers:["교육·강의","콘텐츠 기획","글쓰기·편집","홍보·마케팅"],growth:"이미지·숫자·체험 등 비언어적 방식으로도 정보를 정리해보세요.",relS:"의견을 언어로 정리하고 상대의 이야기를 핵심 중심으로 연결하는 데 강점을 활용할 수 있습니다.",relC:"설명이 길어지면 상대가 핵심을 놓칠 수 있으니 결론을 먼저 말하고 이해 여부를 확인해보세요.",work:"읽고 쓰고 설명하면서 내용을 자신의 언어로 재구성하는 방식이 잘 맞을 수 있습니다."},
    logical:{strength:"원인과 결과, 규칙과 순서를 찾아 복잡한 문제를 구조화하는 활동에서 강점을 활용하기 좋습니다.",careers:["기획·전략","데이터 분석","연구","개발·IT","재무·품질관리"],growth:"효율과 정답뿐 아니라 사람의 감정과 상황적 맥락도 함께 고려해보세요.",relS:"복잡한 상황을 차분히 정리하고 해결책을 제안하는 역할에 강점을 활용할 수 있습니다.",relC:"상대가 공감을 원하는 순간에는 해결책보다 감정을 먼저 확인하는 것이 도움이 됩니다.",work:"목표를 단계로 나누고 체크리스트·숫자·기준을 활용하는 방식이 잘 맞을 수 있습니다."},
    spatial:{strength:"그림, 위치, 형태, 배치처럼 시각적 구조를 파악하고 구성하는 활동에서 강점을 활용하기 좋습니다.",careers:["디자인","건축·공간기획","영상·사진","제품기획","시각 콘텐츠"],growth:"머릿속 이미지를 문장·일정·실행 단계로 구체화하는 연습을 더해보세요.",relS:"상황의 전체 그림을 파악하고 새로운 관점을 제시하는 역할에 강점을 활용할 수 있습니다.",relC:"내가 머릿속으로 이해한 그림을 상대도 알고 있다고 가정하지 말고 구체적으로 설명해보세요.",work:"도표·이미지·마인드맵처럼 전체 구조를 눈으로 볼 수 있는 자료를 활용해보세요."},
    bodily:{strength:"직접 움직이고 체험하며 익히거나 현장에서 실행하는 활동에서 강점을 활용하기 좋습니다.",careers:["스포츠·코칭","공연·무대","현장 운영","체험교육","기술·제작"],growth:"바로 행동하기 전에 목표와 순서를 짧게 정리하면 실행력을 더 안정적으로 활용할 수 있습니다.",relS:"말보다 행동으로 돕고 함께 움직이며 분위기에 활력을 더하는 역할에 강점을 활용할 수 있습니다.",relC:"빠른 행동 속도가 상대에게 재촉처럼 느껴지지 않도록 상대의 속도도 확인해보세요.",work:"직접 해보고 반복하며 익히는 실습·체험 중심 방식이 잘 맞을 수 있습니다."},
    musical:{strength:"리듬, 소리, 반복되는 패턴과 감각적인 흐름을 활용하는 활동에서 강점을 활용하기 좋습니다.",careers:["음악·공연","음향","영상·미디어","예술교육","콘텐츠 제작"],growth:"감각적인 아이디어를 기록하고 일정과 목표로 구체화해보세요.",relS:"분위기와 말투의 변화를 섬세하게 느끼고 조화를 만드는 역할에 강점을 활용할 수 있습니다.",relC:"분위기를 민감하게 받아들일 때 상대의 의도를 혼자 단정하기보다 직접 확인해보세요.",work:"리듬·반복·소리 또는 일정한 패턴을 활용하는 학습 환경이 도움이 될 수 있습니다."},
    interpersonal:{strength:"사람과 협력하고 의견을 주고받으며 관계 속에서 목표를 만들어가는 활동에 관심을 두어볼 수 있습니다.",careers:["상담·코칭","교육","HR·조직관리","영업·서비스","행사·커뮤니티 운영"],growth:"다른 사람의 기대뿐 아니라 자신의 시간과 기준도 함께 챙겨보세요.",relS:"사람의 반응을 살피고 연결하며 협력 분위기를 만드는 역할에 강점을 활용할 수 있습니다.",relC:"관계를 위해 지나치게 맞추기보다 필요한 경우 자신의 생각과 경계를 분명하게 표현해보세요.",work:"토론·질문·피드백·팀 활동을 통해 생각을 발전시키는 방식이 잘 맞을 수 있습니다."},
    intrapersonal:{strength:"자신의 생각과 목표를 돌아보고 스스로 방향을 정하는 활동에서 강점을 활용하기 좋습니다.",careers:["기획","연구","창작","코칭","독립 프로젝트"],growth:"충분히 생각한 뒤에만 시작하기보다 작은 행동부터 시험해보세요.",relS:"자신의 감정과 생각을 정리하고 관계를 돌아보는 능력을 관계 개선에 활용할 수 있습니다.",relC:"혼자 정리할 시간이 필요할 때 침묵만 하기보다 필요한 시간을 상대에게 알려주세요.",work:"혼자 집중할 시간, 개인 목표, 자기평가를 활용하는 방식이 잘 맞을 수 있습니다."},
    naturalistic:{strength:"세부 특징을 관찰하고 분류하며 환경 속 차이와 반복 패턴을 발견하는 활동에 관심을 두어볼 수 있습니다.",careers:["환경·생명","연구·조사","식품·농업","반려동물 분야","현장 분석"],growth:"세부 차이에 집중하면서 전체 목적과 우선순위도 함께 확인해보세요.",relS:"작은 변화와 세부사항을 알아차리고 꼼꼼하게 챙기는 역할에 강점을 활용할 수 있습니다.",relC:"세부 오류가 먼저 보이더라도 상대가 말하려는 큰 의도를 먼저 확인해보세요.",work:"실제 사례를 관찰하고 비교·분류하며 기록하는 방식이 잘 맞을 수 있습니다."}
};

function renderDetailedReport(result, fingerprintData) {
    const ranking = result.ranking || [];
    if (!ranking.length) return;
    const top3 = ranking.slice(0,3);
    const low2 = ranking.slice(-2).reverse();

    const enhancedReport =
        document.getElementById("enhancedReport");

    if (enhancedReport) {
        enhancedReport.className =
            "enhanced-report " +
            (REPORT_THEME[top3[0].key] || "theme-blue");
    }

    document.getElementById("reportModeBadge").textContent =
        testMode === "simple" ? "간편검사 · 4개 지문 · 각 1회" : "정밀검사 · 10개 지문 · 각 1회";

    document.getElementById("coreSummary").innerHTML = `
        <strong>${top3.map(x=>x.name).join(" · ")}</strong>
        <p>이번 결과에서는 <b>${top3[0].name}</b> 영역이 가장 높게 나타났으며
        ${top3[1].name}, ${top3[2].name} 영역이 뒤를 이었습니다.
        상위 영역의 특징을 함께 활용할 수 있는 활동과 환경을 탐색해보세요.</p>`;

    document.getElementById("strengthTop3").innerHTML = top3.map((x,i)=>`
        <article class="strength-card">
            <div class="rank-label">TOP ${i+1}</div>
            <h4>${x.name}<span>${x.score}점</span></h4>
            <p>${REPORT_INFO[x.key].strength}</p>
        </article>`).join("");

    const careers=[];
    top3.forEach(x=>REPORT_INFO[x.key].careers.forEach(c=>{if(!careers.includes(c)) careers.push(c)}));
    document.getElementById("careerRecommendations").innerHTML =
        careers.slice(0,9).map(c=>`<span>${c}</span>`).join("") +
        `<p class="report-note">직업·역할은 진로 판정이 아니라 상위 영역을 활용해볼 수 있는 활동 분야의 예시입니다.</p>`;

    document.getElementById("growthPoints").innerHTML = low2.map(x=>`
        <div class="compact-insight"><b>${x.name} · ${x.score}점</b><p>${REPORT_INFO[x.key].growth}</p></div>`).join("");

    document.getElementById("relationshipStrengths").innerHTML = top3.slice(0,2).map(x=>`
        <div class="compact-insight"><b>${x.name}</b><p>${REPORT_INFO[x.key].relS}</p></div>`).join("");

    document.getElementById("relationshipCautions").innerHTML =
        top3.slice(0,2).map(x=>{
            const d = RELATIONSHIP_DETAIL[x.key];
            return `
                <article class="relationship-detail-card">
                    <div class="relationship-detail-title">${x.name}</div>
                    <div><b>갈등 상황에서 나타날 수 있는 모습</b><p>${d.conflict}</p></div>
                    <div><b>상대가 필요로 할 수 있는 것</b><p>${d.otherNeeds}</p></div>
                    <div><b>관계에서 연습하면 좋은 행동</b><p>${d.practice}</p></div>
                    <div class="relationship-phrase"><b>도움이 되는 표현</b><span>${d.phrase}</span></div>
                </article>
            `;
        }).join("");

    document.getElementById("workStudyStyle").innerHTML =
        `<p class="engine-style">${result.learningStyle.description}</p>` +
        top3.slice(0,2).map(x=>`<div class="insight-line"><b>${x.name}</b> — ${REPORT_INFO[x.key].work}</div>`).join("");

    document.getElementById("allAreaAnalysis").innerHTML = ranking.map(x=>{
        const level=x.score>=75?"높게 나타남":x.score>=60?"상대적 강점":x.score>=45?"균형 영역":"성장 아이디어 영역";
        return `<div class="area-row"><div class="area-head"><b>${x.name}</b><span>${x.score} · ${level}</span></div>
        <div class="area-track"><i style="width:${Math.max(0,Math.min(100,x.score))}%"></i></div></div>`;
    }).join("");

    document.getElementById("fingerprintDetailTable").innerHTML =
        `<div class="finger-table">` + fingers.map(f=>{
            const key=fingerprintData[f.key];
            const p=FingerprintEngine.patterns[key];
            return `<div class="finger-row"><span>${f.hand} ${f.name}</span><b>${p?p.label:key}</b></div>`;
        }).join("") + `</div>`;
}


// ==========================================
// 결과 화면 렌더링
// ==========================================

function renderResult(
    result,
    fingerprintData
) {

    const meta = [];

    if (participant.name) {
        meta.push(participant.name);
    }

    if (participant.birth) {
        meta.push(participant.birth);
    }

    if (participant.consultant) {
        meta.push(`상담자 ${participant.consultant}`);
    }

    resultParticipant.textContent =
        meta.join(" · ");


    if (top3Results) top3Results.innerHTML = "";

    result.top3.forEach(
        (item, index) => {

            const card =
                document.createElement("div");

            card.className =
                "top3-item";

            card.innerHTML = `
                <div class="top3-rank">
                    ${index + 1}
                </div>
                <div class="top3-name">
                    ${item.name}
                </div>
                <div class="top3-score">
                    ${item.score}점
                </div>
            `;

            if (top3Results) {
                top3Results.appendChild(card);
            }
        }
    );


    if (intelligenceResults) intelligenceResults.innerHTML = "";

    result.ranking.forEach(
        item => {

            const row =
                document.createElement("div");

            row.className =
                "intelligence-row";

            row.innerHTML = `
                <div class="intelligence-row-head">
                    <span>${item.name}</span>
                    <strong>${item.score}</strong>
                </div>
                <div class="score-track">
                    <div
                        class="score-fill"
                        style="width:${Math.max(
                            0,
                            Math.min(100, item.score)
                        )}%"
                    ></div>
                </div>
            `;

            if (intelligenceResults) {
                intelligenceResults.appendChild(row);
            }
        }
    );


    learningStyleResult.textContent =
        result.learningStyle.description;


    if (fingerPatternResults) fingerPatternResults.innerHTML = "";

    fingers.forEach(
        finger => {

            const patternKey =
                fingerprintData[finger.key];

            const pattern =
                FingerprintEngine.patterns[
                    patternKey
                ];

            const item =
                document.createElement("div");

            item.className =
                "finger-pattern-item";

            item.innerHTML = `
                <span>
                    ${finger.hand} ${finger.name}
                </span>
                <strong>
                    ${
                        pattern
                            ? pattern.label
                            : patternKey
                    }
                    ${
                        fingerprintImages[finger.key] &&
                        fingerprintImages[finger.key].detection &&
                        fingerprintImages[finger.key].detection.usedFallback
                            ? " (낮은 신뢰도)"
                            : ""
                    }
                </strong>
            `;

            if (fingerPatternResults) {
                fingerPatternResults.appendChild(item);
            }
        }
    );

    renderDetailedReport(
        result,
        fingerprintData
    );
}


// ==========================================
// 새 검사
// ==========================================

restartBtn.addEventListener(
    "click",
    function () {

        currentIndex = 0;
        fingerprintImages = {};
        repeatCaptures = {};
        fingers = [...fullFingers];
        testMode = "full";

        nameInput.value = "";
        birthInput.value = "";
        consultantInput.value = "";

        previewArea.style.border = "";

        showScreen(
            startScreen
        );

        nameInput.focus();
    }
);


// ==========================================
// 결과 PDF
// ==========================================

if (pdfBtn) {
    pdfBtn.addEventListener(
        "click",
        () => {
            document.body.classList.add("printing-report");
            window.print();

            setTimeout(
                () => {
                    document.body.classList.remove("printing-report");
                },
                500
            );
        }
    );
}


