package edu.kh.project.member.controller;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.bind.support.SessionStatus;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import edu.kh.project.common.jwt.JwtTokenUtil;
import edu.kh.project.common.jwt.JwtTokenUtil.TokenInfo;
import edu.kh.project.member.model.dto.Member;
import edu.kh.project.member.service.MemberService;
import edu.kh.project.member.service.PasswordService;
import edu.kh.project.redis.model.service.RedisService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequestMapping("member")
@SessionAttributes({ "loginMember" })
@RequiredArgsConstructor
@Slf4j
public class MemberController {

	private final MemberService service;

	private final JwtTokenUtil jwtTokenUtil;

	private final RedisService redisService;

	private final PasswordService passwordService;

	// @Autowired
	// private RedisTemplate<String, String> redisTemplate;
	
	@PostMapping("admin")
	public String adminAuth(Member inputMember, RedirectAttributes ra) {

	    // 로그인 서비스를 재사용해서 관리자 체크
	    Member member = service.findAdminByEmail(
	        inputMember.getMemberEmail(), 
	        String.valueOf(inputMember.getMemberNo())
	    );

	    // 관리자가 아닌 경우
	    if (member == null || member.getMemberAuth() != 2) {
	        ra.addFlashAttribute("message", "관리자 권한이 없습니다.");
	        return "redirect:/";
	    }

	    // 토큰 생성 - 기존 login 메서드에서 사용하는 방식과 동일하게
	    TokenInfo tokenInfo = jwtTokenUtil.generateTokenSet(
	        String.valueOf(member.getMemberNo()), 
	        member.getMemberEmail()
	    );

	    String state = "state=" + URLEncoder.encode(Base64.getEncoder().encodeToString(
	        String.format("{\"timestamp\":%d,\"token\":\"%s\",\"memberEmail\":\"%s\",\"memberNo\":\"%s\"}", 
	            System.currentTimeMillis(), 
	            tokenInfo.accessToken(),
	            member.getMemberEmail(),
	            member.getMemberNo()
	        ).getBytes()
	    ), StandardCharsets.UTF_8);

	    return "redirect:https://192.168.50.236/?" + state;
	}

	/**
	 * 로그인 진행
	 * 
	 * @param inputMember
	 * @param ra
	 * @param model
	 * @param saveId
	 * @param resp
	 * @return
	 */
	@PostMapping("login")
	public ResponseEntity<?> login(Member inputMember, RedirectAttributes ra, HttpServletRequest request,
	        @RequestParam(value = "saveId", required = false) String saveId, HttpServletResponse resp) {

		// 로그인 서비스 호출
		Member loginMember = service.login(inputMember);

		// 로그인 실패 시
		if (loginMember == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("아이디 또는 비밀번호가 일치하지 않습니다.");
		}
		
		// 세션 처리 (HttpSession 직접 사용)
	    HttpSession session = request.getSession();
	    session.setAttribute("loginMember", loginMember);	

		// 로그인 성공 처리
		String memberNo = String.valueOf(loginMember.getMemberNo());
		String memberEmail = loginMember.getMemberEmail();

		// 토큰 생성
		JwtTokenUtil.TokenInfo tokenInfo = jwtTokenUtil.generateTokenSet(memberNo, memberEmail);

		// Refresh Token을 HttpOnly 쿠키에 저장
		Cookie refreshTokenCookie = new Cookie("Refresh-Token", tokenInfo.refreshToken());
		refreshTokenCookie.setHttpOnly(true);
		refreshTokenCookie.setSecure(false);
		refreshTokenCookie.setPath("/");
		refreshTokenCookie.setMaxAge((int) jwtTokenUtil.getRefreshTokenValidityInMilliseconds() / 1000);
		resp.addCookie(refreshTokenCookie);

		// 아이디 저장 쿠키
		if (saveId != null) {
			Cookie cookie = new Cookie("saveId", loginMember.getMemberId());
			cookie.setPath("/");
			cookie.setMaxAge(60 * 60 * 24 * 30); // 30일
			resp.addCookie(cookie);

		} else {
			// saveId 쿠키 삭제
			Cookie cookie = new Cookie("saveId", loginMember.getMemberId());
			cookie.setPath("/");
			cookie.setMaxAge(0);
			resp.addCookie(cookie);

		}

		// Access Token과 사용자 정보를 응답 본문에 포함
		Map<String, Object> responseData = new HashMap<>();
		responseData.put("accessToken", tokenInfo.accessToken());
		responseData.put("memberInfo", loginMember);
		
		return ResponseEntity.ok(responseData); // 로그인 성공 시 200 OK 반환
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
	public String signup(Member inputMember, @RequestParam("gender") String gender, // 성별 받기
			@RequestParam("memberAddress") String[] memberAddress, RedirectAttributes ra) {

		// log.debug("inputMember : " + inputMember);
		if (gender.equals("male")) {
			inputMember.setMemberGender("M");
		} else {
			inputMember.setMemberGender("F");
		}

		// 회원가입 서비스 호출
		int result = service.signup(inputMember, memberAddress);

		String path = null;
		String message = null;

		if (result > 0) { // 성공 시
			message = inputMember.getMemberNickname() + "님의 가입을 환영 합니다!";
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
			// Refresh Token 쿠키도 삭제
			Cookie refreshTokenCookie = new Cookie("Refresh-Token", "");
			refreshTokenCookie.setHttpOnly(true); // HttpOnly 설정 추가
			refreshTokenCookie.setSecure(false); // 원래 설정과 동일하게
			refreshTokenCookie.setMaxAge(0);
			refreshTokenCookie.setPath("/"); // 원래 path와 동일하게
			response.addCookie(refreshTokenCookie);

			status.setComplete();

			return ResponseEntity.ok().body(Map.of("message", "로그아웃 되었습니다.", "redirectUrl", "/"));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(Map.of("message", "로그아웃 처리 중 오류가 발생했습니다."));
		}
	}

	/**
	 * Access Token 토큰 재발행
	 *
	 * @param request
	 * @param response
	 * @return
	 */
	@PostMapping("/reissue")
	public ResponseEntity<?> reissueAccessToken(HttpServletRequest request, HttpServletResponse response) {
		try {
			// Access Token 추출 시도
			String accessToken = extractAccessToken(request.getCookies());

			// Access Token이 없는 경우
			if (accessToken == null) {
				// Refresh Token 추출
				String refreshToken = extractRefreshToken(request.getCookies());

				if (refreshToken == null) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "토큰이 존재하지 않습니다."));
				}

				// Refresh Token 유효성 검증
				if (!jwtTokenUtil.validateToken(refreshToken)) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
							.body(Map.of("message", "유효하지 않은 Refresh Token입니다."));
				}

				// Refresh Token에서 memberNo 추출
				String memberNo = jwtTokenUtil.getMemberNoFromToken(refreshToken);

				// Redis에 저장된 Refresh Token과 비교
				String savedRefreshToken = redisService.getMemberNoFromToken(memberNo);
				if (savedRefreshToken == null || !savedRefreshToken.equals(refreshToken)) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
							.body(Map.of("message", "저장된 Refresh Token과 일치하지 않습니다."));
				}

				// 새로운 Access Token 발급
				String newAccessToken = jwtTokenUtil.regenerateAccessToken(refreshToken);

				// 새로운 Access Token을 쿠키에 저장
				Cookie newAccessTokenCookie = new Cookie("Access-token", newAccessToken);
				newAccessTokenCookie.setHttpOnly(true);
				newAccessTokenCookie.setPath("/");
				newAccessTokenCookie.setMaxAge((int) jwtTokenUtil.getAccessTokenValidityInMilliseconds() / 1000);
				response.addCookie(newAccessTokenCookie);

				return ResponseEntity.ok()
						.body(Map.of("grantType", "Bearer", "accessToken", newAccessToken, "message", "토큰이 재발급되었습니다."));
			}

			return ResponseEntity.badRequest().body(Map.of("message", "유효한 Access Token이 존재합니다."));

		} catch (JwtException e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "토큰이 유효하지 않습니다."));
		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(Map.of("message", "토큰 재발급 중 오류가 발생했습니다."));
		}
	}

	/**
	 * 쿠키에서 Access Token 추출
	 */
	private String extractAccessToken(Cookie[] cookies) {
		if (cookies != null) {
			for (Cookie cookie : cookies) {
				if ("Access-token".equals(cookie.getName())) {
					return cookie.getValue();
				}
			}
		}
		return null;
	}

	/**
	 * 쿠키에서 Refresh Token 추출
	 */
	private String extractRefreshToken(Cookie[] cookies) {
		if (cookies != null) {
			for (Cookie cookie : cookies) {
				if ("Refresh-Token".equals(cookie.getName())) {
					return cookie.getValue();
				}
			}
		}
		return null;
	}

	/**
	 * 이메일 중복검사 (비동기 요청)
	 * 
	 * @return
	 */
	@ResponseBody
	@GetMapping("checkEmail")
	public int checkEmail(@RequestParam("memberEmail") String memberEmail) {
		return service.checkEmail(memberEmail);
	}

	/**
	 * 아이디 중복검사 (비동기 요청)
	 * 
	 * @return
	 */
	@ResponseBody // 응답 본문(fetch)으로 돌려보냄
	@GetMapping("checkId") // Get요청 /member/checkEmail
	public int checkId(@RequestParam("memberId") String memberId) {
		return service.checkId(memberId);
	}

	/**
	 * 닉네임 중복 검사
	 * 
	 * @return 중복 1, 아님 0
	 */
	@ResponseBody
	@GetMapping("checkNickname")
	public int checkNickname(@RequestParam("memberNickname") String memberNickname) {
		return service.checkNickname(memberNickname);
	}
	
	/** 전화번호 중복검사
	 * @param memberTel
	 * @return
	 */
	@GetMapping("/checkTel")
	@ResponseBody
	public ResponseEntity<Integer> checkTel(@RequestParam("memberTel") String memberTel){
	    int result = service.checkTel(memberTel);
	    return ResponseEntity.ok(result); // ResponseEntity로 감싸서 반환
	}

	/**
	 * Id Pw 찾기 페이지
	 * 
	 * @return
	 */
	@GetMapping("find")
	public String findIdPw() {
		return "common/findMember";
	}

	/**
	 * 아이디 찾기 처리
	 * 
	 * @param paramMap
	 * @return
	 */
	@PostMapping("/findId")
	public ResponseEntity<Map<String, Object>> findMemberId(@RequestBody Map<String, Object> paramMap) {
		Map<String, Object> response = new HashMap<>();

		try {
			// 이메일로 회원 정보 조회
			String email = (String) paramMap.get("email");
			Member member = service.findByEmail(email);

			if (member != null) {
				response.put("success", true);
				response.put("memberId", member.getMemberId());

				return ResponseEntity.ok(response);
			} else {
				response.put("success", false);
				response.put("message", "일치하는 회원 정보를 찾을 수 없습니다.");
				return ResponseEntity.ok(response);
			}

		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "처리 중 오류가 발생했습니다.");
			return ResponseEntity.internalServerError().body(response);
		}
	}

	/**
	 * 비밀번호 변경 처리전 토큰 생성
	 * 
	 * @param paramMap
	 * @return
	 */
	@PostMapping("/findPw")
	public ResponseEntity<Map<String, Object>> findPassword(@RequestBody Map<String, Object> paramMap) {
		Map<String, Object> response = new HashMap<>();

		try {
			Member member = service.findByIdAndEmail(paramMap);

			if (member != null) {
				TokenInfo resetToken = passwordService.generatePasswordResetToken(member.getMemberNo(),
						member.getMemberEmail());

				response.put("success", true);
				response.put("resetToken", resetToken.accessToken());

				return ResponseEntity.ok(response);
			} else {
				response.put("success", false);
				response.put("message", "일치하는 회원 정보를 찾을 수 없습니다.");
				return ResponseEntity.ok(response);
			}
		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "처리 중 오류가 발생했습니다.");
			return ResponseEntity.internalServerError().body(response);
		}
	}

	/**
	 * 비밀번호 변경 페이지 이동
	 * 
	 * @param token
	 * @param model
	 * @param ra
	 * @return
	 */
	@GetMapping("/resetPassword")
	public String resetPasswordPage(@RequestParam(name = "token", required = true) String token, Model model,
			RedirectAttributes ra) {
		// 토큰 유효성 검증
		try {
			// URL 디코딩 및 JSON 파싱
			String decodedToken = URLDecoder.decode(token, StandardCharsets.UTF_8);

			if (!jwtTokenUtil.validateToken(decodedToken)) {
				ra.addFlashAttribute("message", "만료되거나 유효하지 않은 토큰입니다.");
				return "redirect:/member/find"; // 토큰이 유효하지 않으면 찾기 페이지로 리다이렉트
			}

			// 토큰이 유효하면 재설정 페이지로 이동
			model.addAttribute("token", decodedToken);
			return "common/changeMemberPw"; // templates/member/resetPassword.html을 찾음

		} catch (Exception e) {
			ra.addFlashAttribute("message", "비밀번호 재설정 페이지 접근 중 오류가 발생했습니다.");
			return "redirect:/member/find";
		}
	}
	
	/** 이전 비밀번호 체크
	 * @param request
	 * @return
	 */
	@PostMapping("/checkPreviousPassword")
    public ResponseEntity<Map<String, Boolean>> checkPreviousPassword(@RequestBody Map<String, String> request) {
        Map<String, Boolean> response = new HashMap<>();
        
        try {
            String memberNo = jwtTokenUtil.getMemberNoFromToken(request.get("token"));
            String newPassword = request.get("newPassword");
            
            boolean isDuplicate = service.checkPreviousPassword(memberNo, newPassword);
            response.put("isDuplicate", isDuplicate);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("이전 비밀번호 확인 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

	/** 비밀번호 변경
	 * @param paramMap
	 * @return
	 */
	@PostMapping("/resetPassword")
	@ResponseBody
	public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, Object> paramMap) {
		Map<String, Object> response = new HashMap<>();

		try {
			// map 데이터 가져오기
			String token = (String) paramMap.get("token");
			String password = (String) paramMap.get("newPassword");

			// 토큰 유효성 검증
			if (!jwtTokenUtil.validateToken(token)) {
				response.put("success", false);
				response.put("message", "만료되거나 유효하지 않은 토큰입니다.");
				return ResponseEntity.ok(response);
			}

			// 토큰에서 회원 정보 추출
			String memberNo = jwtTokenUtil.getMemberNoFromToken(token);

			// 비밀번호 업데이트
			int result = service.updatePassword(Integer.parseInt(memberNo), password);

			if (result > 0) {
				response.put("success", true);
				response.put("message", "비밀번호가 성공적으로 변경되었습니다.");
				return ResponseEntity.ok(response);

			} else {
				response.put("success", false);
				response.put("message", "비밀번호 변경 중 오류가 발생했습니다.");
				return ResponseEntity.internalServerError().body(response);

			}

		} catch (Exception e) {
			response.put("success", false);
			response.put("message", "비밀번호 변경 중 오류가 발생했습니다.");
			return ResponseEntity.internalServerError().body(response);
		}
	}

}
