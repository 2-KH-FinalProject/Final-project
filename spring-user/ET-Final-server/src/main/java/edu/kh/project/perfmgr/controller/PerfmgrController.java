package edu.kh.project.perfmgr.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.SessionAttribute;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.bind.support.SessionStatus;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import edu.kh.project.common.jwt.JwtTokenUtil;
import edu.kh.project.perfmgr.model.dto.PerfMgr;
import edu.kh.project.perfmgr.service.PerfmgrService;
import edu.kh.project.performance.model.dto.Performance;
import edu.kh.project.redis.model.service.RedisService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequestMapping("perfmgr")
@SessionAttributes({ "loginMember" })
@RequiredArgsConstructor
@Slf4j
public class PerfmgrController {

	private final PerfmgrService service;

	private final JwtTokenUtil jwtTokenUtil;

	private final RedisService redisService;

	/** 공연 관리자 로그인
	 * @param inputMember
	 * @param request
	 * @param saveId
	 * @param resp
	 * @return
	 */
	@PostMapping("login")
	public ResponseEntity<?> login(PerfMgr inputMember, HttpServletRequest request,
	        @RequestParam(value = "saveId", required = false) String saveId, HttpServletResponse resp) {

	    // 로그인 서비스 호출
	    PerfMgr perfmgrLoginMember = service.login(inputMember);

	    // 로그인 실패 시
	    if (perfmgrLoginMember == null) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                .body("아이디 또는 비밀번호가 일치하지 않습니다.");
	    }

	    // 세션 처리
	    HttpSession session = request.getSession();
	    session.setAttribute("loginMember", perfmgrLoginMember);

	    // JWT 토큰 생성
	    String memberNo = String.valueOf(perfmgrLoginMember.getConcertManagerNo());
	    String memberEmail = perfmgrLoginMember.getConcertManagerEmail();

	    // 토큰 생성 및 Redis에 저장
	    JwtTokenUtil.TokenInfo tokenInfo = jwtTokenUtil.generateTokenSet(memberNo, memberEmail);

	    // Access Token을 HttpOnly 쿠키에 저장
	    Cookie accessTokenCookie = new Cookie("Access-Token", tokenInfo.accessToken());
	    accessTokenCookie.setHttpOnly(true);
	    accessTokenCookie.setSecure(false); // 개발환경은 false
	    accessTokenCookie.setPath("/");
	    accessTokenCookie.setMaxAge((int) jwtTokenUtil.getAccessTokenValidityInMilliseconds() / 1000);
	    resp.addCookie(accessTokenCookie);

	    // Refresh Token을 HttpOnly 쿠키에 저장
	    Cookie refreshTokenCookie = new Cookie("Refresh-Token", tokenInfo.refreshToken());
	    refreshTokenCookie.setHttpOnly(true);
	    refreshTokenCookie.setSecure(false);
	    refreshTokenCookie.setPath("/api/auth/refresh");
	    refreshTokenCookie.setMaxAge((int) jwtTokenUtil.getRefreshTokenValidityInMilliseconds() / 1000);
	    resp.addCookie(refreshTokenCookie);

	    // saveId 쿠키 처리
	    if (saveId != null) {
	        Cookie cookie = new Cookie("saveId", perfmgrLoginMember.getConcertManagerId());
	        cookie.setPath("/");
	        cookie.setMaxAge(60 * 60 * 24 * 30); // 30일
	        resp.addCookie(cookie);
	    } else {
	        Cookie cookie = new Cookie("saveId", perfmgrLoginMember.getConcertManagerId());
	        cookie.setPath("/");
	        cookie.setMaxAge(0);
	        resp.addCookie(cookie);
	    }

	    // 응답 데이터 구성
	    Map<String, Object> responseData = new HashMap<>();
	    responseData.put("accessToken", tokenInfo.accessToken());
	    responseData.put("memberInfo", perfmgrLoginMember);
	    
	    return ResponseEntity.ok(responseData);
	}

	/**
	 * 회원 가입
	 * 
	 * @param inputMember   : 입력된 회원 정보(memberEmail, memberPw, memberNickname,
	 *                      memberTel, (memberAddress - 따로 배열로 받아서 처리))
	 * @param memberAddress : 입력한 주소 input 3개의 값을 배열로 전달 [우편번호, 도로명/지번주소, 상세주소]
	 * @param ra            : 리다이렉트 시 request scope로 데이터 전달하는 객체
	 * @return
	 */
	@PostMapping("signup")
	public String signup(PerfMgr inputMember, RedirectAttributes ra) {

		// 회원가입 서비스 호출
		int result = service.signup(inputMember);

		String path = null;
		String message = null;

		if (result > 0) { // 성공 시
			message = inputMember.getConcertManagerNickname() + "님의 가입을 환영 합니다!";
			path = "/";

		} else { // 실패
			message = "회원 가입 실패...";
			path = "sigunup";
		}

		ra.addFlashAttribute("message", message);

		return "redirect:" + path;
	}

	/**
	 * 로그아웃 진행
	 * 
	 * @param request
	 * @param response
	 * @return
	 */
	@PostMapping("logout")
	public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response, SessionStatus status) {
		try {
			// Access Token 쿠키 삭제
			Cookie accessTokenCookie = new Cookie("Access-token", "");
			accessTokenCookie.setMaxAge(0);
			accessTokenCookie.setPath("/");
			response.addCookie(accessTokenCookie);

			// Refresh Token 쿠키도 삭제
			Cookie refreshTokenCookie = new Cookie("Refresh-token", "");
			refreshTokenCookie.setMaxAge(0);
			refreshTokenCookie.setPath("/");
			response.addCookie(refreshTokenCookie);

			status.setComplete();

			return ResponseEntity.ok().body(Map.of("message", "로그아웃 되었습니다.", "redirectUrl", "/"));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(Map.of("message", "로그아웃 처리 중 오류가 발생했습니다."));
		}
	}

	/**
	 * 이메일 중복검사 (비동기 요청)
	 * 
	 * @return
	 */
	@ResponseBody
	@GetMapping("checkEmail")
	public int checkEmail(@RequestParam("concertManagerEmail") String concertManagerEmail) {
		return service.checkEmail(concertManagerEmail);
	}

	/**
	 * 아이디 중복검사 (비동기 요청)
	 * 
	 * @return
	 */
	@ResponseBody // 응답 본문(fetch)으로 돌려보냄
	@GetMapping("checkId") // Get요청 /member/checkEmail
	public int checkId(@RequestParam("concertManagerId") String concertManagerId) {
		return service.checkId(concertManagerId);
	}

	/**
	 * 닉네임 중복 검사
	 * 
	 * @return 중복 1, 아님 0
	 */
	@ResponseBody
	@GetMapping("checkNickname")
	public int checkNickname(@RequestParam("concertManagerNickname") String concertManagerNickname) {
		return service.checkNickname(concertManagerNickname);
	}

	/**
	 * 공연관리 버튼 눌렀을 때 공연 목록 / 공연 등록 조회하는 경로로 이동
	 * 
	 * @return
	 * @author 우수민
	 */
	@GetMapping("performance-management")
	public String performanceManagement() {
		return "perfmgr/performance-management";
	}

	/**
	 * 관리자가 등록한 공연 목록 페이지로 이동
	 * 
	 * @param loginMember
	 * @param model
	 * @return
	 */
	@GetMapping("/performance-list")
	public String manager(@SessionAttribute("loginMember") PerfMgr loginMember, Model model) {

		// 로그인된 관리자 정보 가져오기
		int memberNo = loginMember.getConcertManagerNo();

		// 등록된 공연 목록 가져오기 (서비스 호출)
		List<Performance> performances = service.getPerformancesByManager(memberNo);

		// 모델에 공연 목록 추가
		model.addAttribute("performances", performances);

		return "perfmgr/performance-list";
	}

	/**
	 * 공연 등록 버튼 눌렀을 때 공연 등록하는 페이지로 이동
	 * 
	 * @return
	 * @author 우수민
	 */
	@GetMapping("performance-registration")
	public String updatePerformance() {
		return "perfmgr/performance-registration";
	}

	/**
	 * 관리자 공연 상세페이지
	 * 
	 * @param mt20id
	 * @param model
	 * @return
	 * @author 우수민
	 */
	@GetMapping("/performance-manager-detail/{mt20id}")
	public String managerDetail(@PathVariable("mt20id") String mt20id, Model model) {
		
		log.info("Fetching performance details for ID: {}", mt20id);

		Performance performance = service.getPerformanceById(mt20id);
		log.info("Retrieved performance: {}", performance);

		if (performance == null) {
			log.warn("No performance found for ID: {}", mt20id);
			return "error/404";
		}

		model.addAttribute("performance", performance);
		return "perfmgr/performance-manager-detail";
	}
	

	/** 관리자 공연 상세 페이지에서 수정 버튼 클릭 시
     *  해당 공연 수정 페이지로 이동
     * @param mt20id
     * @return
     * @author 우수민
     */
	@GetMapping("/performance-modifyPerformance")
	public String modifyPerformance(@RequestParam("mt20id") String mt20id, Model model) {
	    try {
	    	
	        // 공연 정보 조회
	        Performance performance = service.getPerformanceDetail(mt20id);
	        
	        // 모델에 공연 정보 추가
	        model.addAttribute("performance", performance);
	        
	        return "perfmgr/performance-modifyPerformance";
	        
	    } catch (Exception e) {
	        log.error("공연 수정 페이지 로딩 중 에러 발생: ", e);
	        return "error/error";  // 에러 페이지로 리다이렉트
	    }
	}
	

	/** 수정된 내용으로 상세페이지, DB 업데이트
	 * @param mt20id
	 * @param performances
	 * @return
	 */
	@PostMapping("/performance-modifyPerformance/{mt20id}")
	public ResponseEntity<?> modifyPerformanceUpdate(
	    @PathVariable("mt20id") String mt20id,
	    @RequestBody Performance performance) {

	    Performance updateData = new Performance();
	    updateData.setMt20id(mt20id);
	    updateData.setPrfnm(performance.getPrfnm());
	    updateData.setPrfruntime(performance.getPrfruntime());
	    updateData.setPrfcast(performance.getPrfcast());

	    boolean isUpdated = service.modifyPerformanceUpdate(updateData);

	    if (isUpdated) {
	    	
	        // JSON 형식으로 응답
	        return ResponseEntity.ok().body(Map.of("message", "수정 성공"));
	    }
	    
	    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                        .body(Map.of("message", "수정 실패"));
	}
	
    /** 관리자 상세 정보 페이지에서 삭제 버튼 누를 시
     *  PERFORMANCE_DEL_FL 값을 'Y'로 업데이트
     * @param mt20id
     * @param request
     * @return
     * @author 우수민
     */
    @PostMapping("/delete/{mt20id}")
    public ResponseEntity<String> deletePerformance(@PathVariable("mt20id") String mt20id) {

        boolean updated = service.updatePerformanceDeleteFlag(mt20id);

        if (updated) {
            return ResponseEntity.ok("공연이 성공적으로 삭제되었습니다.");
            
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("공연 삭제 중 오류가 발생했습니다.");
        }
    }
}
