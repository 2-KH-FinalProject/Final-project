// 전역 변수 설정
let page = 1;
let isLoading = false;
let hasMoreData = true;
let currentFilter = 'all';
let initialLoadComplete = false;

// 검색 관련 변수 추가
let searchKeyword = '';
let searchType = 'all';

// 검색 이벤트 핸들러
function handleSearch() {
	const keyword = document.getElementById('performanceSearchInput').value.trim();  // ID 변경
	const type = document.getElementById('performanceSearchType').value;  // ID 변경

	searchKeyword = keyword;
	searchType = type;

	// 검색 시 상태 초기화
	page = 1;
	hasMoreData = true;
	const grid = document.getElementById('performanceGrid');
	grid.innerHTML = '';

	loadMorePerformances();
}

// 스크롤 버튼 관련 코드
const scrollToTopButton = document.getElementById('scrollToTop');

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

// HTML 이스케이프 함수
function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// 공연 요소 생성
function createPerformanceElement(performance) {
	const div = document.createElement('div');
	div.className = 'performance-item';
	div.onclick = () => location.href = `/perfmgr/perfmgr-manager-detail/${performance.mt20id}`;

	const img = new Image();
	img.src = performance.poster || '/images/default-poster.png';
	img.className = 'performance-image';
	img.alt = performance.prfnm;
	img.loading = 'lazy';
	img.decoding = 'async';

	if (!img.complete) {
		img.onload = function() {
			this.classList.add('loaded');
			img.onload = null;
		};
	} else {
		img.classList.add('loaded');
	}

	img.onerror = function() {
		if (this.src !== '/images/default-poster.png') {
			this.src = '/images/default-poster.png';
		}
		this.onerror = null;
	};

	// 별점 생성 함수
	const createStarRating = (rating) => {
		const fullStars = '★'.repeat(Math.floor(rating));
		const emptyStars = '☆'.repeat(5 - Math.floor(rating));
		return `${fullStars}${emptyStars}`;
	};

	div.innerHTML = `
        <div class="image-container"></div>
        <div class="performance-info">
            <div class="performance-title">${escapeHtml(performance.prfnm)}</div>
            <div class="performance-date">
                <span>${performance.prfpdfrom}</span> ~
                <span>${performance.prfpdto}</span>
            </div>
            <div class="performance-venue">${escapeHtml(performance.fcltynm)}</div>
			<div class="performance-rank">
            <div class="review-stars">
                <span class="static-stars">${createStarRating(performance.avgRating)}</span>
                <span class="numeric-rating">${performance.avgRating}/5</span>
            </div>
        </div>
    </div>
    `;

	const container = div.querySelector('.image-container');
	container.appendChild(img);

	return div;
}

// 데이터 로드 함수
function loadMorePerformances() {
	if (isLoading || !hasMoreData) return;

	// 검색어가 있고, 첫 페이지 이후라면 추가 로드 중단
	if (searchKeyword && page > 1) {
		hasMoreData = false;
		return;
	}

	isLoading = true;
	const spinner = document.querySelector('.loading-spinner');
	spinner.classList.add('show');

	const searchParams = new URLSearchParams({
		page: page,
		genre: '',
		filter: currentFilter,
		searchKeyword: searchKeyword,
		searchType: searchType
	});

	fetch(`/performanceApi/genre/more?${searchParams.toString()}`)
		.then(response => {
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			return response.json();
		})
		.then(performances => {
			if (performances && performances.length > 0) {
				const grid = document.getElementById('performanceGrid');
				performances.forEach(performance => {
					grid.appendChild(createPerformanceElement(performance));
				});
				// 검색어가 없을 때만 페이지 증가
				if (!searchKeyword) {
					page += 1;
				} else {
					hasMoreData = false; // 검색 시에는 추가 로드 중단
				}
			} else {
				hasMoreData = false;
				if (page === 1) {
					showNoDataMessage(currentFilter, searchKeyword);
				}
			}

		})
		.catch(error => {
			console.error('Error loading performances:', error);
			hasMoreData = false;
		})
		.finally(() => {
			isLoading = false;
			spinner.classList.remove('show');
		});
}

// 데이터 없음 메시지 표시
function showNoDataMessage(filter, keyword) {
	const container = document.querySelector('.performance-container');

	// 기존 메시지 제거
	const existingMessage = document.querySelector('.no-data-message');
	if (existingMessage) {
		existingMessage.remove();
	}

	const messageDiv = document.createElement('div');
	messageDiv.className = 'no-data-message';

	let message = '검색 결과가 없습니다';
	if (!keyword) {
		message = '등록된 공연이 없습니다';
	}

	messageDiv.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🎭</div>
            <h3>${message}</h3>
            <p>다른 검색어로 시도해보세요</p>
        </div>
    `;
	container.appendChild(messageDiv);
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

// 필터 클릭 핸들러
function handleFilterClick(e) {
	const existingMessage = document.querySelector('.no-data-message');
	if (existingMessage) {
		existingMessage.remove();
	}

	const button = e.target;
	if (button.classList.contains('active')) return;

	// 활성화된 버튼 변경
	document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
	button.classList.add('active');

	// 필터 변경 및 데이터 리로드
	currentFilter = button.dataset.filter;
	page = 1;
	hasMoreData = true;
	const grid = document.getElementById('performanceGrid');
	grid.innerHTML = '';
	loadMorePerformances();
}

// 스크롤 이벤트 핸들러
const scrollHandler = throttle(() => {
	if (isLoading || !hasMoreData) return;

	const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
	if (scrollTop + clientHeight >= scrollHeight - 300) {
		loadMorePerformances();
	}
}, 150);

// 초기화 및 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 필터 상태 복원
    const savedFilter = localStorage.getItem('perfmgrFilter');
    if (savedFilter) {
        currentFilter = savedFilter;
        const filterButton = document.querySelector(`.filter-btn[data-filter="${savedFilter}"]`);
        if (filterButton) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            filterButton.classList.add('active');
			localStorage.removeItem('perfmgrFilter');
        }
    }

    // 검색 버튼 클릭 이벤트
    document.getElementById('performanceSearchButton').addEventListener('click', handleSearch);

    // 엔터 키 이벤트
    document.getElementById('performanceSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 필터 버튼 이벤트 리스너 등록
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            // 현재 필터 상태 저장
            const filter = this.dataset.filter;
            localStorage.setItem('perfmgrFilter', filter);
            handleFilterClick(e);
        });
    });

    // 첫 데이터 로드
    loadMorePerformances();

    // 이벤트 리스너 등록
    scrollToTopButton.addEventListener('click', scrollToTop);
    window.addEventListener('scroll', throttle(toggleScrollButton, 100));

    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', scrollHandler, { passive: true });
});

// 정리
window.addEventListener('unload', () => {
	scrollToTopButton.removeEventListener('click', scrollToTop);
	window.removeEventListener('scroll', scrollHandler);
});