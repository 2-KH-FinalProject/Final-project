// 스크롤 버튼 관련 코드
const scrollToTopButton = document.getElementById('scrollToTop');

// 삭제 기능
function deletePerformance() {
   if (confirm('정말로 이 공연을 삭제하시겠습니까?')) {
       const mt20id = document.getElementById('mt20id').value;

       const currentFilter = document.querySelector('.tab-button.active')?.dataset.filter || 'all';
       localStorage.setItem('perfmgrFilter', currentFilter);

       fetch(`/perfmgr/delete/${mt20id}`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({ performanceDelFl: 'Y' })
       })
       .then(response => {
           if (response.ok) {
               alert('공연이 성공적으로 삭제되었습니다.');
               window.location.href = '/perfmgr/perfmgr-list';
           } else {
               alert('공연 삭제 중 오류가 발생했습니다.');
           }
       })
       .catch(error => {
           console.error('Error:', error);
           alert('공연 삭제 중 오류가 발생했습니다.');
       });
   }
}

// 목록으로 돌아가기
function goBack() {
   window.history.back();
}

// 스로틀 함수
function throttle(func, limit) {
   let inThrottle;
   return function(...args) {
       if (!inThrottle) {
           func.apply(this, args);
           inThrottle = true;
           setTimeout(() => inThrottle = false, limit);
       }
   }
}

// 스크롤 버튼 표시/숨김 처리
function toggleScrollButton() {
   if (window.scrollY > 300) {
       scrollToTopButton.classList.add('visible');
   } else {
       scrollToTopButton.classList.remove('visible');
   }
}

// 최상단으로 스크롤
function scrollToTop() {
   window.scrollTo({
       top: 0,
       behavior: 'smooth'
   });
}

// 초기화 및 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
   // 목록으로 돌아가기 버튼에 이벤트 리스너 추가
   const backButton = document.getElementById('backToList');
   if (backButton) {
       backButton.addEventListener('click', goBack);
   }

   // 스크롤 버튼 이벤트 리스너 등록
   scrollToTopButton.addEventListener('click', scrollToTop);
   window.addEventListener('scroll', throttle(toggleScrollButton, 100), { passive: true });
});

// 정리
window.addEventListener('unload', () => {
   if (scrollToTopButton) {
       scrollToTopButton.removeEventListener('click', scrollToTop);
   }
   window.removeEventListener('scroll', toggleScrollButton);
});