// 모듈 스코프를 사용한 상태 관리
const state = {
    page: 1,
    isLoading: false,
    hasMoreData: true,
    currentFilter: 'all',
    initialLoadComplete: false,
    searchKeyword: '',
    searchType: 'all',
	savedFilter: localStorage.getItem('performanceFilter') || 'all' // 추가
};

// DOM 요소 캐싱
const domElements = {
    grid: document.getElementById('performanceGrid'),
    spinner: document.querySelector('.loading-spinner'),
    searchInput: document.getElementById('performanceSearchInput'),
    searchType: document.getElementById('performanceSearchType'),
    searchButton: document.getElementById('performanceSearchButton'),
    scrollToTopButton: document.getElementById('scrollToTop')
};

// HTML 이스케이프 함수
const escapeHtml = (() => {
    const escape = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    const regex = new RegExp(`[${Object.keys(escape).join('')}]`, 'g');
    return (str) => str.replace(regex, match => escape[match]);
})();

// 별점 생성 함수
const createStarRating = (rating) => {
    const fullStars = '★'.repeat(Math.floor(rating));
    const emptyStars = '☆'.repeat(5 - Math.floor(rating));
    return `${fullStars}${emptyStars}`;
};

// 공연 요소 생성
function createPerformanceElement(performance) {
    const div = document.createElement('div');
    div.className = 'performance-item';
    div.onclick = () => location.href = `/performance/detail/${performance.mt20id}`;

    const img = new Image();
    img.src = performance.poster;
    img.className = 'performance-image';
    img.alt = performance.prfnm;
    img.loading = 'lazy';
    img.decoding = 'async';

    // 이미지 로드 이벤트
    if (!img.complete) {
        img.onload = function() {
            this.classList.add('loaded');
            img.onload = null;
        };
    } else {
        img.classList.add('loaded');
    }

    // 이미지 에러 처리
    img.onerror = function() {
        if (this.src !== '/images/default-poster.png') {
            this.src = '/images/default-poster.png';
        }
        this.onerror = null;
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

// 현재 장르 가져오기
function getCurrentGenre() {
    const path = window.location.pathname;
    const match = path.match(/genre\/([^/]+)$/);
    if (match) {
        let urlGenre = match[1];
        switch (urlGenre) {
            case 'musical': return '뮤지컬';
            case 'theater': return '연극';
            case 'classic': return '서양음악(클래식)';
            default: return urlGenre;
        }
    }
    console.error('Cannot determine genre from URL:', path);
    return null;
}

// 데이터 없음 메시지 생성
function createNoDataMessage(filter) {
    const div = document.createElement('div');
    div.className = 'no-data-message';

    let message, suggestion;

    if (state.searchKeyword) {
        message = '검색 결과가 없습니다';
        suggestion = `<p>다른 검색어로 시도해보세요</p>`;
    } else {
        switch (filter) {
            case 'rating':
                message = '등록된 공연이 없습니다';
                suggestion = `<p>다른 카테고리를 확인해보세요</p>
                            <div class="filter-suggestions">
                                <span class="filter-tag" onclick="document.querySelector('[data-filter=\\'rating\\']').click()">인기 공연</span>
                                <span class="filter-tag" onclick="document.querySelector('[data-filter=\\'upcoming\\']').click()">예정된 공연</span>
                            </div>`;
                break;
            case 'upcoming':
                message = '예정된 공연이 없습니다';
                suggestion = `<p>다른 장르의 공연을 확인해보세요</p>
                            <div class="genre-buttons">
                                <button class="suggestion-btn" onclick="location.href='/performance/genre/musical'">뮤지컬</button>
                                <button class="suggestion-btn" onclick="location.href='/performance/genre/theater'">연극</button>
                                <button class="suggestion-btn" onclick="location.href='/performance/genre/classic'">클래식</button>
                            </div>`;
                break;
            case 'ongoing':
                message = '현재 진행중인 공연이 없습니다';
                suggestion = `<p>곧 시작될 공연을 확인해보세요</p>
                            <button class="suggestion-btn" onclick="document.querySelector('[data-filter=\\'upcoming\\']').click()">
                                공연 예정작 보기
                            </button>`;
                break;
            default:
                message = '등록된 공연이 없습니다';
                suggestion = `<p>다른 카테고리를 확인해보세요</p>
                            <div class="filter-suggestions">
                                <span class="filter-tag" onclick="document.querySelector('[data-filter=\\'rating\\']').click()">인기 공연</span>
                                <span class="filter-tag" onclick="document.querySelector('[data-filter=\\'upcoming\\']').click()">예정된 공연</span>
                            </div>`;
        }
    }

    div.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🎭</div>
            <h3>${message}</h3>
            ${suggestion}
        </div>
    `;

    return div;
}

// 데이터 로드
async function loadMorePerformances() {
    if (state.isLoading || !state.hasMoreData) return;

    if (state.searchKeyword && state.page > 1) {
        state.hasMoreData = false;
        return;
    }

    state.isLoading = true;
    domElements.spinner.classList.add('show');

    const currentGenre = getCurrentGenre();
    if (!currentGenre) {
        console.error('Genre not found');
        return;
    }

    const searchParams = new URLSearchParams({
        page: state.page,
        genre: currentGenre,
        filter: state.currentFilter,
        searchKeyword: state.searchKeyword,
        searchType: state.searchType
    });

    try {
        const response = await fetch(`/performanceApi/genre/more?${searchParams.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const performances = await response.json();
        
        if (performances?.length) {
            const fragment = document.createDocumentFragment();
            performances.forEach(performance => {
                fragment.appendChild(createPerformanceElement(performance));
            });
            domElements.grid.appendChild(fragment);
            state.page += 1;
        } else {
            if (state.page === 1 && domElements.grid.children.length === 0) {
                const noDataMessage = createNoDataMessage(state.currentFilter);
                domElements.grid.appendChild(noDataMessage);
            }
            state.hasMoreData = false;
        }
    } catch (error) {
        console.error('Error loading performances:', error);
        state.hasMoreData = false;
    } finally {
        state.isLoading = false;
        state.initialLoadComplete = true;
        domElements.spinner.classList.remove('show');
    }
}

// 스로틀 함수
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            requestAnimationFrame(() => inThrottle = false);
        }
    };
}

// 스크롤 이벤트 핸들러
const scrollHandler = throttle(() => {
    if (state.isLoading || !state.hasMoreData) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 300) {
        loadMorePerformances();
    }
}, 16);

// 스크롤 버튼 토글
function toggleScrollButton() {
    const shouldShow = window.scrollY > 300;
    domElements.scrollToTopButton.classList.toggle('visible', shouldShow);
}

// 최상단으로 스크롤
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 검색 처리
function handleSearch() {
    const keyword = domElements.searchInput.value.trim();
    const type = domElements.searchType.value;

    state.searchKeyword = keyword;
    state.searchType = type;
    state.page = 1;
    state.hasMoreData = true;
    
    domElements.grid.innerHTML = '';
    loadMorePerformances();
}

// 탭 클릭 핸들러
function handleTabClick(button) {
    if (button.classList.contains('active')) return;

    document.querySelector('.tab-button.active')?.classList.remove('active');
    button.classList.add('active');

    state.currentFilter = button.dataset.filter;
	localStorage.setItem('performanceFilter', state.currentFilter);
    state.page = 1;
    state.hasMoreData = true;
    
    domElements.grid.innerHTML = '';
    loadMorePerformances();
}

// 초기화 및 이벤트 리스너
function initializeEventListeners() {
	// 저장된 필터 상태 복원
    const savedFilter = state.savedFilter;
    if (savedFilter) {
        const savedTabButton = document.querySelector(`.tab-button[data-filter="${savedFilter}"]`);
        if (savedTabButton) {
            state.currentFilter = savedFilter;
            savedTabButton.classList.add('active');
            document.querySelector('.tab-button.active')?.classList.remove('active');
            savedTabButton.classList.add('active');
			localStorage.removeItem('performanceFilter');
        }
    }
	
    domElements.searchButton.addEventListener('click', handleSearch);
    domElements.searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => handleTabClick(button));
    });

    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('scroll', throttle(toggleScrollButton, 100), { passive: true });
    domElements.scrollToTopButton.addEventListener('click', scrollToTop);

    if (!state.initialLoadComplete) {
        loadMorePerformances();
    }
}

// 이벤트 리스너 제거
function cleanup() {
    window.removeEventListener('scroll', scrollHandler);
    domElements.scrollToTopButton.removeEventListener('click', scrollToTop);
}

// 초기화
document.addEventListener('DOMContentLoaded', initializeEventListeners);
window.addEventListener('unload', cleanup);