// =========================================================================
// 전역 변수 및 DOM 요소 선택
// =========================================================================

const resetPasswordForm = document.getElementById('resetPasswordForm');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const resetToken = document.getElementById('resetToken');

// 메시지 요소 생성
const newPasswordMessage = document.createElement("p");
const confirmPasswordMessage = document.createElement("p");
newPassword.parentElement.append(newPasswordMessage);
confirmPassword.parentElement.append(confirmPasswordMessage);

// =========================================================================
// 유틸리티 함수
// =========================================================================

// debounce 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =========================================================================
// 유효성 검사 함수
// =========================================================================

// 비밀번호 유효성 검사
function validatePassword(password) {
    const regExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,12}$/;
    return regExp.test(password);
}

// 이전 비밀번호 체크
async function checkPreviousPassword(newPassword) {
    try {
        const response = await fetch('/member/checkPreviousPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                newPassword: newPassword,
                token: resetToken.value
            })
        });
        const result = await response.json();
        return result.isDuplicate;
    } catch (error) {
        console.error('Error checking previous password:', error);
        return false;
    }
}

// 비밀번호 일치 확인
function validatePasswordMatch() {
    const password = newPassword.value;
    const confirmPw = confirmPassword.value;

    if (password !== confirmPw) {
        confirmPasswordMessage.innerText = "비밀번호가 일치하지 않습니다.";
        confirmPasswordMessage.style.color = "red";
        return false;
    } else {
        confirmPasswordMessage.innerText = "비밀번호가 일치합니다.";
        confirmPasswordMessage.style.color = "green";
        return true;
    }
}

// =========================================================================
// 이벤트 핸들러
// =========================================================================

// 비밀번호 실시간 검사
newPassword.addEventListener("input", debounce(async (e) => {
    const password = e.target.value;

    if (password.trim().length === 0) {
        newPasswordMessage.innerText = "비밀번호를 입력해주세요. (영어, 숫자, 특수문자 포함 6~12자)";
        newPasswordMessage.style.color = "gray";
    } else if (!validatePassword(password)) {
        newPasswordMessage.innerText = "특수문자(!, @, #, $, %, *)를 포함하여 6~12자여야 합니다.";
        newPasswordMessage.style.color = "red";
    } else {
        // 기본 유효성 검사를 통과한 경우에만 서버 검증 수행
        const isDuplicate = await checkPreviousPassword(password);
        if (isDuplicate) {
            newPasswordMessage.innerText = "이전에 사용한 비밀번호입니다. 다른 비밀번호를 입력해주세요.";
            newPasswordMessage.style.color = "red";
        } else {
            newPasswordMessage.innerText = "유효한 비밀번호입니다.";
            newPasswordMessage.style.color = "green";
        }
    }

    // 비밀번호 확인이 입력되어 있다면 일치 여부 다시 검사
    if (confirmPassword.value.length > 0) {
        validatePasswordMatch();
    }
}, 100));

// 비밀번호 확인 실시간 검사
confirmPassword.addEventListener("input", (e) => {
    if (e.target.value.trim().length === 0) {
        confirmPasswordMessage.innerText = "";
    } else {
        validatePasswordMatch();
    }
});

// 폼 제출 처리
resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = newPassword.value;
    const confirmPw = confirmPassword.value;

    // 비밀번호 일치 확인
    if (password !== confirmPw) {
        alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        return;
    }

    // 유효성 검사
    if (!validatePassword(password)) {
        alert("올바른 형식의 비밀번호를 입력해주세요.");
        return;
    }

    // 이전 비밀번호와 동일한지 확인
    const isDuplicate = await checkPreviousPassword(password);
    if (isDuplicate) {
        alert("이전에 사용한 비밀번호입니다. 다른 비밀번호를 입력해주세요.");
        return;
    }

    try {
        const response = await fetch('/member/resetPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: resetToken.value,
                newPassword: password
            })
        });

        const result = await response.json();

        if (result.success) {
            alert("비밀번호가 변경되었습니다.");
            window.location.href = '/';
        } else {
            alert(result.message || "비밀번호 변경에 실패했습니다.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("서버 오류가 발생했습니다.");
    }
});