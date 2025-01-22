// 페이지 로드 시 회원 정보 불러오기
document.addEventListener("DOMContentLoaded", () => {
	loadUserInfo();
});

// 회원 정보 불러오기
function loadUserInfo() {


	fetch("/mypage/info")
		.then(response => response.json())
		.then(data => {


			// 폼에 데이터 채우기
			document.getElementById("userId").value = data.memberId || "";

			document.getElementById("userTel").value = data.memberTel || "";
			document.getElementById("currentTel").value = data.memberTel || "";

			document.getElementById("userNickname").value = data.memberNickname || "";
			document.getElementById("currentNickname").value = data.memberNickname || "";

			document.getElementById("verificationEmail").value = data.memberEmail || "";
			document.getElementById("currentEmail").value = data.memberEmail || ""; 
		

			// 성별 설정
			if (data.memberGender === "M") {
				document.getElementById("male").checked = true;
			} else if (data.memberGender === "F") {
				document.getElementById("female").checked = true;
			}
		})
		.catch(error => {
			console.error("회원 정보 로딩 실패:", error);
			alert("회원 정보를 불러오는데 실패했습니다.");
		});
}

const mypageCheckObj = {
	authKey: true,          // 이메일 인증 여부 (초기값 true로 변경)
	verificationEmail: true, // 이메일 중복검사 (초기값 true로 변경)
	userNickname: true,     // 닉네임 중복검사 (초기값 true로 변경)
	userTel: true          // 전화번호 유효성 (초기값 true로 변경)
};


// 인증번호 받기 버튼
const verificationBtn = document.querySelector("#verificationBtn");

// 인증번호 입력 input
const verificationCode = document.querySelector("#verificationCode");

// 인증번호 입력 후 확인 버튼
const verificationConfirmBtn = document.querySelector("#verificationConfirmBtn");

// 인증번호 관련 메시지 출력 span
const verificationMessage = document.querySelector("#verificationMessage");

let verificationTimer;

const verificationMin = 4; // 타이머 초기값 (분)
const verificationSec = 59; // 타이머 초기값 (초)
const verificationTime = "05:00";

// 실제 줄어드는 시간을 저장할 변수
let minit = verificationMin;
let second = verificationSec;



// 이메일 유효성 검사에 사용될 요소 얻어오기
const verificationEmail = document.querySelector("#verificationEmail");
const verificationEmailMessage = document.querySelector("#verificationEmailMessage");

/* 이메일 중복 검사 로직 */
verificationEmail.addEventListener("input", e => {
    const inputEmail = e.target.value.trim();
    const currentEmail = document.querySelector("#currentEmail").value;

    // 입력된 이메일이 없는 경우
    if (inputEmail.length === 0) {
        verificationEmailMessage.innerText = "";
        mypageCheckObj.verificationEmail = true;
        mypageCheckObj.authKey = true;
        return;
    }

    // 현재 이메일과 동일한 경우
    if (inputEmail === currentEmail) {
        verificationEmailMessage.innerText = "현재 사용중인 이메일입니다.";
        verificationEmailMessage.classList.add("confirm");
        verificationEmailMessage.classList.remove("error");
        mypageCheckObj.verificationEmail = true;
        mypageCheckObj.authKey = true;
        return;
    }

    // 이메일 형식 검사
    const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegExp.test(inputEmail)) {
        verificationEmailMessage.innerText = "이메일 형식이 유효하지 않습니다.";
        verificationEmailMessage.classList.add("error");
        verificationEmailMessage.classList.remove("confirm");
        mypageCheckObj.verificationEmail = false;
        mypageCheckObj.authKey = false;
        return;
    }

    // 이메일 중복 검사 수행
    fetch(`/mypage/verifyEmail?verificationEmail=${encodeURIComponent(inputEmail)}&currentEmail=${encodeURIComponent(currentEmail)}`)
        .then(resp => resp.text()) // JSON 대신 text로 받기
        .then(result => {
            const count = parseInt(result);
            if (count === 1) { // 중복된 경우
                verificationEmailMessage.innerText = "이미 사용중인 이메일입니다.";
                verificationEmailMessage.classList.add("error");
                verificationEmailMessage.classList.remove("confirm");
                mypageCheckObj.verificationEmail = false;
                mypageCheckObj.authKey = false;
            } else { // 사용 가능한 경우
                verificationEmailMessage.innerText = "사용 가능한 이메일입니다.";
                verificationEmailMessage.classList.add("confirm");
                verificationEmailMessage.classList.remove("error");
                mypageCheckObj.verificationEmail = true;
                // 이메일이 변경되었으므로 인증이 필요함
                mypageCheckObj.authKey = false;
            }
        })
        .catch(error => {
            console.error("이메일 중복 검사 중 오류 발생:", error);
            verificationEmailMessage.innerText = "중복 검사 중 오류가 발생했습니다.";
            verificationEmailMessage.classList.add("error");
            verificationEmailMessage.classList.remove("confirm");
            mypageCheckObj.verificationEmail = false;
            mypageCheckObj.authKey = false;
        });
});



// 인증번호 받기 버튼 클릭 시 
verificationBtn.addEventListener("click", () => {

	if (mypageCheckObj.verificationEmail) {

		mypageCheckObj.authKey = false;
		verificationMessage.innerText = "";

		// 클릭 시 타이머 숫자 초기화
		minit = verificationMin;
		second = verificationSec;

		// 이전 동작중인 인터벌 클리어(없애기)
		clearInterval(verificationTimer);

		// 비동기로 서버에서 메일보내기 
		fetch("/mypage/sendEmail", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: verificationEmail.value
		})
			.then(resp => resp.text())
			.then(result => {
				if (result == 1) {
					console.log("인증 번호 발송 성공");
				} else {
					console.log("인증 번호 발송 실패!!!!");
				}
			});

		// **********************************************************************        

		// 메일은 비동기로 서버에서 보내라고 하고
		// 화면에서는 타이머 시작하기

		verificationMessage.innerText = verificationTime; // 05:00 세팅
		verificationMessage.classList.remove("confirm", "error"); // 검정 글씨

		alert("인증번호가 발송되었습니다.");

		// 인증 시간 출력(1초 마다 동작)
		verificationTimer = setInterval(() => {

			verificationMessage.innerText = `${addZero(minit)}:${addZero(second)}`;

			// 0분 0초인 경우 ("00:00" 출력 후)
			if (minit == 0 && second == 0) {
				mypageCheckObj.authKey = false; // 인증 못함
				clearInterval(verificationTimer); // interval 멈춤
				verificationMessage.classList.add('error');
				verificationMessage.classList.remove('confirm');
				return;
			}

			// 0초인 경우(0초를 출력한 후)
			if (second == 0) {
				second = 60;
				minit--;
			}

			second--; // 1초 감소

		}, 1000); // 1초 지연시간
	} else {
		alert("이메일을 다시 확인해 주세요.");
		verificationEmail.focus();
	}
});

// 전달 받은 숫자가 10 미만인 경우(한자리) 앞에 0 붙여서 반환
function addZero(number) {
	if (number < 10) return "0" + number;
	else return number;
}


// ------------------------------------------------------------------

// 인증하기 버튼 클릭 시
// 입력된 인증번호를 비동기로 서버에 전달
// -> 입력된 인증번호와 발급된 인증번호가 같은지 비교
//   같으면 1, 아니면 0반환
// 단, 타이머가 00:00초가 아닐 경우에만 수행

verificationConfirmBtn.addEventListener("click", () => {

	if (minit === 0 && second === 0) { // 타이머가 00:00인 경우
		alert("인증번호 입력 제한시간을 초과하였습니다.");
		return;
	}

	if (verificationCode.value.length < 6) { // 인증번호가 제대로 입력 안된 경우(길이가 6미만인 경우)
		alert("인증번호를 정확히 입력해 주세요.");
		return;
	}

	// 문제 없는 경우(제한시간, 인증번호 길이 유효 시)
	// 입력받은 이메일, 인증번호로 객체 생성
	const vfObj = {
		"email": verificationEmail.value,
		"authKey": verificationCode.value
	};

	// 인증번호 확인용 비동기 요청 보냄
	fetch("/email/checkAuthKey", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(vfObj) // obj JS 객체를 JSON 으로 변경
	})
		.then(resp => resp.text())
		.then(result => {
			// 1 or 0

			if (result == 0) {
				alert("인증번호가 일치하지 않습니다!");
				mypageCheckObj.authKey = false;
				return;
			}

			// 일치할 때
			clearInterval(verificationTimer); // 타이머 멈춤

			$("#verificationEmail").attr("readonly", true);        // readonly 처리
			$("#authKey").attr("readonly", true);        // readonly 처리

			verificationMessage.innerText = "인증 되었습니다.";
			verificationMessage.classList.remove("error");
			verificationMessage.classList.add("confirm");
			document.querySelector("#verificationEmail").value = verificationEmail.value;

			mypageCheckObj.authKey = true; // 인증번호 검사여부 true 변경
		});


});



//*****************************************************************************************

/* 닉네임 유효성 검사 */
const userNickname = document.querySelector("#userNickname");
const updateNickMessage = document.querySelector("#updateNickMessage");

userNickname.addEventListener("input", (e) => {

	const inputNickname = e.target.value;
	const currentNickname = document.querySelector("#currentNickname").value; // 현재 사용자의 닉네임을 저장

	// 닉네임을 입력한 경우에만 검증 실행
	if (inputNickname.trim().length > 0) {

		mypageCheckObj.userNickname = false; // 검증 필요함을 표시



		// 정규식 검사
		const regExp = /^[가-힣\w\d]{2,10}$/;

		if (!regExp.test(inputNickname)) { // 유효 X
			updateNickMessage.innerText = "닉네임은 한글,영어,숫자로만 2~10글자로 작성해주세요.";
			updateNickMessage.classList.add("error");
			updateNickMessage.classList.remove("confirm");

			return;
		}

		// 현재 닉네임과 동일한 경우 중복 검사 스킵
		if (inputNickname === currentNickname) {
			updateNickMessage.innerText = "현재 사용중인 닉네임입니다.";
			updateNickMessage.classList.add("confirm");
			updateNickMessage.classList.remove("error");
			mypageCheckObj.userNickname = true;
			return;
	}

		// 3) 중복 검사 (유효한 경우)
		fetch(`/mypage/updateNickname?userNickname=
			${encodeURIComponent(inputNickname)}&currentNickname=${encodeURIComponent(currentNickname)}`)
		.then(resp => resp.text())
		.then(count => {
				if (count === "1") { // 중복인 경우
						updateNickMessage.innerText = "이미 사용중인 닉네임입니다.";
						updateNickMessage.classList.add("error");
						updateNickMessage.classList.remove("confirm");
						mypageCheckObj.userNickname = false;
				} else { // 사용 가능한 경우
						updateNickMessage.innerText = "사용 가능한 닉네임입니다.";
						updateNickMessage.classList.add("confirm");
						updateNickMessage.classList.remove("error");
						mypageCheckObj.userNickname = true;
				}
		})
		.catch(error => {
				console.error("닉네임 중복 검사 중 오류 발생:", error);
				updateNickMessage.innerText = "중복 검사 중 오류가 발생했습니다.";
				updateNickMessage.classList.add("error");
				updateNickMessage.classList.remove("confirm");
				mypageCheckObj.userNickname = false;
		});
} else {
// 닉네임 입력값이 없는 경우
updateNickMessage.innerText = "";
mypageCheckObj.userNickname = false; // 빈 값은 유효하지 않음
}
});

// ***************************************************************************

/* 전화번호(휴대폰번호) 유효성 검사 */
const userTel = document.querySelector("#userTel");
const updateTelMessage = document.querySelector("#updateTelMessage");

userTel.addEventListener("input", e => {
    const inputTel = e.target.value.trim();
    const currentTel = document.querySelector("#currentTel").value;

    // 입력값이 없거나 현재 저장된 번호와 동일한 경우
    if (!inputTel) {
        updateTelMessage.innerText = "";
        mypageCheckObj.userTel = true;
        return;
    }

    if (inputTel === currentTel) {
        updateTelMessage.innerText = "현재 사용중인 전화번호입니다.";
        updateTelMessage.classList.add("confirm");
        updateTelMessage.classList.remove("error");
        mypageCheckObj.userTel = true;
        return;
    }

    // 전화번호 형식 검사
    const regExp = /^01[0-9]{1}[0-9]{3,4}[0-9]{4}$/;
    if (!regExp.test(inputTel)) {
        updateTelMessage.innerText = "전화번호는 01로 시작하는 10-11자리 숫자여야 합니다.";
        updateTelMessage.classList.add("error");
        updateTelMessage.classList.remove("confirm");
        mypageCheckObj.userTel = false;
        return;
    }

    // 중복 검사
    fetch(`/mypage/verifyTel?userTel=${encodeURIComponent(inputTel)}&currentTel=${encodeURIComponent(currentTel)}`)
        .then(resp => resp.json())
        .then(count => {
            if (count >= 1) {
                updateTelMessage.innerText = "이미 사용중인 전화번호입니다.";
                updateTelMessage.classList.add("error");
                updateTelMessage.classList.remove("confirm");
                mypageCheckObj.userTel = false;
            } else {
                updateTelMessage.innerText = "사용 가능한 전화번호입니다.";
                updateTelMessage.classList.add("confirm");
                updateTelMessage.classList.remove("error");
                mypageCheckObj.userTel = true;
            }
        })
        .catch(error => {
            console.error("전화번호 중복 검사 중 오류 발생:", error);
            updateTelMessage.innerText = "중복 검사 중 오류가 발생했습니다.";
            updateTelMessage.classList.add("error");
            updateTelMessage.classList.remove("confirm");
            mypageCheckObj.userTel = false;
        });
});


// *****************************************************************************

updateForm.addEventListener("submit", e => {
	e.preventDefault();

	// 이메일 인증이 완료되지 않은 경우 경고 메시지 출력 후 종료
	if (!mypageCheckObj.authKey) {
			alert("이메일 인증이 완료되지 않았습니다. 이메일 인증 후 다시 시도해주세요.");
			return;
	}

	// 닉네임 중복 검사 실패한 경우
	if (document.getElementById("userNickname").value.trim() !== "" && !mypageCheckObj.userNickname) {
		alert("닉네임이 올바르지 않습니다.");
		document.getElementById("userNickname").focus();
		return;
}

// 전화번호 중복 검사 실패한 경우
if (document.getElementById("userTel").value.trim() !== "" && !mypageCheckObj.userTel) {
	alert("전화번호가 올바르지 않습니다.");
	document.getElementById("userTel").focus();
	return;
}

// 이메일 중복 검사 실패한 경우
if (document.getElementById("verificationEmail").value.trim() !== "" && !mypageCheckObj.verificationEmail) {
	alert("이메일이 올바르지 않습니다.");
	document.getElementById("verificationEmail").focus();
	return;
}


	// 서버에서 최초 로드된 데이터와 비교
	fetch("/mypage/info")
			.then(response => response.json())
			.then(originalData => {
					const formData = {
							// 기존 데이터를 기본값으로 설정
							memberEmail: originalData.memberEmail,
							memberNickname: originalData.memberNickname,
							memberTel: originalData.memberTel,
							memberGender: originalData.memberGender
					};
					
					let isModified = false;

					// 현재 입력값
					const currentEmail = document.getElementById("verificationEmail").value.trim();
					const currentNickname = document.getElementById("userNickname").value.trim();
					const currentTel = document.getElementById("userTel").value.trim();
					const currentGender = document.querySelector('input[name="gender"]:checked')?.id === 'male' ? 'M' : 'F';

					// 이메일 변경 확인
					if (currentEmail !== originalData.memberEmail && 
							mypageCheckObj.verificationEmail && mypageCheckObj.authKey) {
							formData.memberEmail = currentEmail;
							isModified = true;
					}

					// 닉네임 변경 확인
					if (currentNickname !== originalData.memberNickname && 
							mypageCheckObj.userNickname) {
							formData.memberNickname = currentNickname;
							isModified = true;
					}

					// 전화번호 변경 확인
					if (currentTel !== originalData.memberTel && 
							mypageCheckObj.userTel) {
							formData.memberTel = currentTel;
							isModified = true;
					}

					// 성별 변경 확인
					if (currentGender !== originalData.memberGender) {
							formData.memberGender = currentGender;
							isModified = true;
					}

					// 변경된 값이 없는 경우
					if (!isModified) {
							alert("수정된 회원 정보가 없습니다.");
							return Promise.reject("no_changes");
					}

					// 변경사항이 있는 경우 서버로 전송
					return fetch("/mypage/updateInfo", {
							method: "POST",
							headers: {
									"Content-Type": "application/json"
							},
							body: JSON.stringify(formData)
					});
			})
			.then(response => {
					if (!response || response === "no_changes") return;
					return response.json();
			})
			.then(result => {
					if (!result) return;
					
					if (result > 0) {
							alert("회원 정보가 성공적으로 수정되었습니다.");
							location.href = "/mypage/memberInfo";
					} else {
							alert("회원 정보 수정에 실패했습니다. 다시 시도해주세요.");
					}
			})
			.catch(error => {
					if (error === "no_changes") return;
					console.error("Error:", error);
					alert("회원 정보 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
			});
});






// // (최종)
// // 수정 버튼 클릭 시 전체 유효성 검사 여부 확인
// // 폼 제출 처리

// updateForm.addEventListener("submit", e => {
// 	e.preventDefault();

// 	// 이메일 인증이 완료되지 않은 경우 경고 메시지 출력 후 종료
// 	if (!mypageCheckObj.authKey) {
// 		alert("이메일 인증이 완료되지 않았습니다. 이메일 인증 후 다시 시도해주세요.");
// 		return;
// 	}

// 	// 변경된 값이 있는지 확인
// 	const formData = {};
// 	let isModified = false;

// 	// 이메일이 입력되었고 유효성 검사를 통과한 경우
// 	const emailValue = document.getElementById("verificationEmail").value.trim();
// 	if (emailValue && mypageCheckObj.verificationEmail && mypageCheckObj.authKey) {
// 		formData.memberEmail = emailValue;
// 		isModified = true;
// 	}

// 	// 닉네임이 입력되었고 유효성 검사를 통과한 경우
// 	const nicknameValue = document.getElementById("userNickname").value.trim();
// 	if (nicknameValue && mypageCheckObj.userNickname) {
// 		formData.memberNickname = nicknameValue;
// 		isModified = true;
// 	}

// 	// 전화번호가 입력되었고 유효성 검사를 통과한 경우
// 	const telValue = document.getElementById("userTel").value.trim();
// 	if (telValue && mypageCheckObj.userTel) {
// 		formData.memberTel = telValue;
// 		isModified = true;
// 	}

// 	// 성별이 선택된 경우
// 	const selectedGender = document.querySelector('input[name="gender"]:checked');
// 	if (selectedGender) {
// 		formData.memberGender = selectedGender.id === 'male' ? 'M' : 'F';
// 		isModified = true;
// 	}

// 	// 변경된 값이 없는 경우
// 	if (!isModified) {
// 		alert("수정된 회원 정보가 없습니다.");
// 		return;
// 	}

// 	// 서버로 데이터 전송
// 	fetch("/mypage/updateInfo", {
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json"
// 		},
// 		body: JSON.stringify(formData)
// 	})
// 		.then(response => response.json())
// 		.then(result => {
// 			if (result > 0) {
// 				alert("회원 정보가 성공적으로 수정되었습니다.");
// 				location.href = "/mypage/memberInfo";
// 			} else {
// 				alert("회원 정보 수정에 실패했습니다. 다시 시도해주세요.");
// 			}
// 		})
// 		.catch(error => {
// 			console.error("Error:", error);
// 			alert("회원 정보 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
// 		});
// });


// 취소 버튼 클릭 시 이전 페이지로 이동
document.querySelector(".cancelBtn").addEventListener("click", () => {
	window.location.href = "/mypage/memberInfo"
});




// **************************************************************

// 쿠키 가져오는 함수
function getNaverCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
	return null;
}


document.addEventListener('DOMContentLoaded', function() {

	// 비밀번호 검증이 필요한 페이지들
	const pagesNeedingVerification = ['updateInfo','changePw','addressManagement','membershipOut'];

	// 현재 활성화된 메뉴 설정
	const setActiveMenu = () => {
		const currentPath = window.location.pathname;
		document.querySelectorAll('.mypage-side-menu-link').forEach(link => {
			link.classList.toggle('active', currentPath.includes(link.dataset.page));
		});
	};


	// 이벤트 핸들러 설정
	const initializeEventHandlers = () => {
		document.querySelectorAll('.mypage-side-menu-link').forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const targetPage = e.target.dataset.page;

				// 쿠키에서 네이버 로그인 여부 확인
				const naverFl = getCookie('naverFl');

				// 네이버 로그인 사용자이거나, 비밀번호 검증이 필요없는 페이지인 경우 바로 이동
				if (naverFl === 'Y' || !pagesNeedingVerification.includes(targetPage)) {
					window.location.href = `/mypage/${targetPage}`;
					return;
				}

				// 그 외의 경우 비밀번호 검증 페이지로 이동
				sessionStorage.setItem('targetPage', targetPage);
				window.location.href = `/mypage/checkPw`;
			});
		});
	};

	// 초기화
	setActiveMenu();
	initializeEventHandlers();
});



