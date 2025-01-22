// Updated Modal functionality with Naver Login initialization
function openModal(modalId) {
	const modal = document.getElementById(modalId);
	if (modal) {
		modal.style.display = 'flex';
		clearModalInputs(modalId);
		setTimeout(() => {
			modal.classList.add('show');
			// 로그인 모달이 열릴 때 네이버 로그인 초기화
			if (modalId === 'loginModal') {
				if (document.getElementById('naverIdLogin')) {
					initializeNaverLogin();
				}
			}
			// 첫 번째 입력 필드에 포커스
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
		}, 10);
	}
}

function closeModal(modalId) {
	const modal = document.getElementById(modalId);
	if (modal) {
		modal.classList.remove('show');
		setTimeout(() => {
			modal.style.display = 'none';
			clearModalInputs(modalId);
		}, 300);
	}
}

function checkForInputData(modalElement) {
    // 모달 내의 입력 필드들을 확인
    const inputs = modalElement.querySelectorAll('input, textarea');
    return Array.from(inputs).some(input => input.value.length > 0);
}

function getModalId(element) {
    return element.id;
}

function clearModalInputs(modalId) {
   const modal = document.getElementById(modalId);
   if (modal) {
      // 모든 입력 필드 초기화
      modal.querySelectorAll('input, textarea').forEach(input => {
         input.value = '';
      });

      // Caps Lock 메시지 초기화
      const capsLockMessages = modal.querySelectorAll('[id$="Message"]');
      capsLockMessages.forEach(msg => {
         msg.innerText = '';
      });
   }
}

function checkCapsLock(event) {
	// 이벤트가 발생한 입력창의 ID를 확인
	const inputId = event.target.id;
	let messageId;
	
	// 입력창 ID에 따라 메시지 div ID 결정
	if (inputId === 'memberLoginPw') {
			messageId = 'checkPwMessage';
	} else if (inputId === 'concertManagerLoginPw') {
			messageId = 'adminCheckPwMessage';
	}
	
	// 해당하는 메시지 div에 메시지 표시
	if (event.getModifierState("CapsLock")) {
			document.getElementById(messageId).innerText = "Caps Lock이 켜져있습니다.";
	} else {
			document.getElementById(messageId).innerText = "";
	}
}