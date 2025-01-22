package edu.kh.project.myPage.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
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

import edu.kh.project.common.jwt.JwtTokenUtil;
import edu.kh.project.email.model.service.EmailService;
import edu.kh.project.member.model.dto.Member;
import edu.kh.project.myPage.model.dto.AddressDTO;
import edu.kh.project.myPage.model.dto.ticketInfoDTO;
import edu.kh.project.myPage.service.MyPageService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@RequestMapping("mypage")
@Slf4j
@SessionAttributes({ "loginMember" })
public class MyPageController {

	private final EmailService emailService;
	private final MyPageService service;
	

	private final JwtTokenUtil jwtTokenUtil;

	@GetMapping("addressManagement")
	public String addressManagement() {
		return "mypage/addressManagement"; // View 이름 반환
	}

	/**
	 * 배송지 목록 조회(로드)
	 * 
	 * @param loginMember
	 * @return
	 */
	@GetMapping("addressList")
	@ResponseBody
	public ResponseEntity<List<AddressDTO>> getAddressList(@SessionAttribute("loginMember") Member loginMember) {
		List<AddressDTO> addressList = myPageService.getAddressList(loginMember.getMemberNo());
		return ResponseEntity.ok(addressList);
	}

	@Autowired
	private MyPageService myPageService;
	

	/**
	 * 배송지 등록 하기
	 * 
	 * @param addressDTO
	 * @param loginMember
	 * @return
	 */
	@PostMapping("addAddress")
	@ResponseBody
	public ResponseEntity<String> addAddress(@RequestBody AddressDTO addressDTO,
			@SessionAttribute("loginMember") Member loginMember) {
		addressDTO.setMemberNo(loginMember.getMemberNo()); // getMemberNo()로 회원 번호 설정

		// 주소 개수 체크
		int addressCount = myPageService.getAddressCount(loginMember.getMemberNo());
		if (addressCount >= 10) {
			return ResponseEntity.status(400).body("배송지는 최대 10개까지만 등록할 수 있습니다.");
		}

		// 중복 주소 체크
		boolean isDuplicated = myPageService.isAddressDuplicated(addressDTO, loginMember.getMemberNo());
		if (isDuplicated) {
			return ResponseEntity.status(400).body("이미 등록된 주소입니다.");
		}

		int result = myPageService.addAddress(addressDTO);
		if (result > 0) {
			return ResponseEntity.ok("배송지가 등록되었습니다.");
		} else {
			return ResponseEntity.status(500).body("배송지 등록에 실패했습니다.");
		}
	}

	/**
	 * 기본 배송지 등록하기
	 * 
	 * @param addressNo
	 * @param loginMember
	 * @return
	 */
	@PostMapping("basicAddress")
	@ResponseBody
	public ResponseEntity<String> basicAddress(@RequestParam("addressNo") int addressNo,
			@SessionAttribute(value = "loginMember", required = true) Member loginMember) {

		try {
			// 디버깅을 위한 로그 추가
			System.out.println("Controller - addressNo: " + addressNo);
			System.out.println("Controller - memberNo: " + loginMember.getMemberNo());

			int result = myPageService.basicAddress(addressNo, loginMember.getMemberNo());
			
			if (result > 0) {
				return ResponseEntity.ok("기본 배송지가 변경되었습니다.");
			} else {
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("기본 배송지 변경에 실패했습니다.");
			}
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("처리 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	/**
	 * 배송지 수정
	 * 
	 * @param addressDTO
	 * @return
	 */

	@PostMapping("/editAddress")
	@ResponseBody
	public ResponseEntity<String> updateAddress(@RequestBody AddressDTO addressDTO) {
		if (!isAddressDTOValid(addressDTO)) {
			return ResponseEntity.badRequest().body("필수 필드를 모두 입력해주세요.");
		}

		int result = myPageService.updateAddress(addressDTO);

		if (result > 0) {
			return ResponseEntity.ok("주소가 성공적으로 수정되었습니다.");
		} else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("주소 수정에 실패했습니다.");
		}
	}

	// AddressDTO 유효성 검사
	private boolean isAddressDTOValid(AddressDTO addressDTO) {
		return addressDTO.getReceiverName() != null && !addressDTO.getReceiverName().isEmpty()
				&& addressDTO.getPostcode() != null && !addressDTO.getPostcode().isEmpty()
				&& addressDTO.getAddress() != null && !addressDTO.getAddress().isEmpty()
				&& addressDTO.getDetailAddress() != null && !addressDTO.getDetailAddress().isEmpty()
				&& addressDTO.getPhone() != null && !addressDTO.getPhone().isEmpty();
	}

	/**
	 * 배송지 데이터 가져오기 (수정 모달에 사용)
	 * 
	 * @param addressNo
	 * @return
	 */
	@GetMapping("/getAddress/{addressNo}")
	@ResponseBody
	public ResponseEntity<AddressDTO> getAddress(@PathVariable int addressNo) {
		AddressDTO address = myPageService.getAddress(addressNo);

		if (address != null) {
			return ResponseEntity.ok(address);
		} else {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
		}
	}

	/**
	 * 배송지 삭제
	 * 
	 * @param addressNo
	 * @param loginMember
	 * @return
	 */
	@DeleteMapping("/deleteAddress/{addressNo}")
	@ResponseBody
	public ResponseEntity<String> deleteAddress(@PathVariable("addressNo") int addressNo, // addressNo 명시적 지정
			@SessionAttribute("loginMember") Member loginMember) {
		try {
			int result = myPageService.deleteAddress(addressNo, loginMember.getMemberNo());

			if (result > 0) {
				return ResponseEntity.ok("배송지가 성공적으로 삭제되었습니다.");
			} else {
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("배송지 삭제에 실패했습니다.");
			}
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("배송지 삭제 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 닉네임 클릭 시 회원정보 페이지로 이동
	@GetMapping("memberInfo")
	public String memberInfo() {

		return "mypage/memberInfo";
	}

	// 비밀번호 검증
	@PostMapping("verifyPassword")
	@ResponseBody
	public int verifyPassword(@RequestParam("memberPw") String memberPw,
			@SessionAttribute("loginMember") Member loginMember, HttpServletResponse resp) {
		// 로그인 성공 처리
		String memberNo = String.valueOf(loginMember.getMemberNo());
		String memberEmail = loginMember.getMemberEmail();

		// 토큰 생성
		JwtTokenUtil.TokenInfo tokenInfo = jwtTokenUtil.generateTokenSet(memberNo, memberEmail);

		// Access Token을 HttpOnly 쿠키에 저장
		Cookie accessTokenCookie = new Cookie("Access-Token", tokenInfo.accessToken());
		accessTokenCookie.setHttpOnly(false);
		accessTokenCookie.setSecure(false);
		accessTokenCookie.setPath("/");
		accessTokenCookie.setMaxAge((int) jwtTokenUtil.getAccessTokenValidityInMilliseconds() / 1000);
		resp.addCookie(accessTokenCookie);

		int result = service.verifyPassword(memberPw, loginMember.getMemberNo());

		return result;
	}

	// 회원 정보 조회
	@GetMapping("info")
	@ResponseBody
	public ResponseEntity<Member> getMemberInfo(@SessionAttribute("loginMember") Member loginMember) {
		Member member = service.getMemberInfo(loginMember.getMemberNo());
		return ResponseEntity.ok(member);
	}

	// 회원정보 수정 페이지로 이동
	@GetMapping("updateInfo")
	public String updateInfo() {

		return "mypage/updateInfo";
	}

	// 비밀번호 변경 페이지로 이동
	@GetMapping("changePw")
	public String ChangePw() {

		return "mypage/changePw";
	}

	// 회원탈퇴 페이지로 이동
	@GetMapping("membershipOut")
	public String membershipOut() {

		return "mypage/membershipOut";
	}
	
	// 1:1 문의 페이지로 이동
	@GetMapping("memberInquiryt")
	public String memberInquiryt() {
		
		return "mypage/memberInquiryt";
	}
	
	// 문의내역 페이지로 이동
	@GetMapping("memberInquirytList")
	public String memberInquirytList() {
		
		return "mypage/memberInquiryList";
	}
	
	// 티켓 예매 내역 확인
    @GetMapping("/checkBookingExists")
    public ResponseEntity<Map<String, Boolean>> checkBookingExists(
        @SessionAttribute("loginMember") Member loginMember
    ) {
        try {
            // 현재 회원의 티켓 예매 내역 확인
            boolean hasBooking = service.checkTicketBookingExists(loginMember.getMemberNo());
            
            Map<String, Boolean> response = new HashMap<>();
            response.put("hasBooking", hasBooking);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                               .body(null);
        }
    }
	
	/** 회원 탈퇴 진행
	 * @param requestMap
	 * @param loginMember
	 * @return
	 */
	@PostMapping("membershipOut")
	@ResponseBody
	public ResponseEntity<Integer> membershipOut(@RequestBody Map<String, String> requestMap,
	        @SessionAttribute("loginMember") Member loginMember,
	        HttpServletResponse response, SessionStatus status) {
	    try {
	        int result = 0;
	        String memberOutPw = requestMap.get("memberOutPw");
	        // 네이버 로그인 사용자인 경우
	        if("Y".equals(loginMember.getNaverFl())) {
	            // 바로 회원 탈퇴 처리
	            result = service.membershipNaverOut(loginMember.getMemberNo());
	            
	        } else {
	            // 일반 회원인 경우 비밀번호 검증 후 탈퇴
	            if(memberOutPw != null) {
	            	// 비밀번호 확인
	        	   int check = service.memberPwCheck(memberOutPw, loginMember.getMemberNo());
	        	   if(check > 0) {
	                   // 비밀번호 일치하면 탈퇴 처리
	                   result = service.membershipOut(loginMember.getMemberNo());
	               } else {
	                   // 비밀번호 불일치
	                   return ResponseEntity.ok(-1);
	               }
	            }
	        }
	        if(result > 0) {
	            // 탈퇴 성공 시 세션 무효화
	        	// Access Token 쿠키 삭제
	        	// Access Token 쿠키 삭제
	        	Cookie accessTokenCookie = new Cookie("Access-Token", "");
	        	accessTokenCookie.setHttpOnly(true);  // HttpOnly 설정 추가
	        	accessTokenCookie.setSecure(false);   // 원래 설정과 동일하게
	        	accessTokenCookie.setMaxAge(0);
	        	accessTokenCookie.setPath("/");
	        	response.addCookie(accessTokenCookie);
	        	// Refresh Token 쿠키도 삭제
	        	Cookie refreshTokenCookie = new Cookie("Refresh-Token", "");
	        	refreshTokenCookie.setHttpOnly(true);  // HttpOnly 설정 추가
	        	refreshTokenCookie.setSecure(false);   // 원래 설정과 동일하게
	        	refreshTokenCookie.setMaxAge(0);
	        	refreshTokenCookie.setPath("/api/auth/refresh");  // 원래 path와 동일하게
	        	response.addCookie(refreshTokenCookie);
				status.setComplete();
				
				
	            return ResponseEntity.ok(1);
	        }
	        // 탈퇴 실패
	        return ResponseEntity.ok(0);
	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    }
	}

	// 비밀번호 변경 페이지로 이동
	@GetMapping("checkPw")
	public String CheckPw() {

		return "mypage/checkPw";
	}
	
	/** 비밀번호 변경
	 * @param loginMember
	 * @param requestData
	 * @return
	 */
	@PostMapping("changePw")
	@ResponseBody
	public int ChangePw(@SessionAttribute("loginMember") Member loginMember,
						   @RequestBody Map<String, String> requestData) {
		// 네이버 로그인 사용자는 비밀번호 변경 불가
        if("Y".equals(loginMember.getNaverFl())) {
            return -1; // 네이버 사용자 오류 코드
        }
        
        String newPassword = requestData.get("newPassword");
        int memberNo = loginMember.getMemberNo();
        
        return service.changePw(memberNo, newPassword);
	}

	
	/**
	 * 이메일 중복검사 (비동기 요청)(수정)
	 * 
	 * @param verificationEmail
	 * @return
	 */
	@ResponseBody
	@GetMapping("verifyEmail")
	public ResponseEntity<Integer> verifyEmail(@RequestParam("verificationEmail") String verificationEmail,
			@RequestParam("currentEmail") String currentEmail) {
		
		// 현재 사용자의 이메일과 동일하면 사용 가능
	    if (verificationEmail.equals(currentEmail)) {
	    	return ResponseEntity.ok(0); // 중복 아님을 나타내는 0 반환
	    }
		
	    int result = service.verifyEmail(verificationEmail);
	    return ResponseEntity.ok(result); // ResponseEntity로 감싸서 반환
	}
	

	/** 이메일 인증번호 보내기 (수정)
	 * @param email
	 * @return
	 */
	@ResponseBody
	@PostMapping("sendEmail")
	public int sendEmail(@RequestBody String email) {

		log.debug("email {}", email);

		String authKey = emailService.sendEmail("updateEmail", email);

		if (authKey != null) { // 인증번호가 반환되어 돌아옴
								// == 이메일 보내기 성공
			return 1;
		}

		// 이메일 보내기 실패
		return 0;
	}
	
	
	

	/**
	 * 닉네임 중복검사 (비동기 요청)(수정)
	 * 
	 * @param memberNickname
	 * @return
	 */
	@ResponseBody
	@GetMapping("updateNickname")
	public int updateNickname(@RequestParam("userNickname") String userNickname,
						@RequestParam("currentNickname") String currentNickname
			) {
		
		
		// 입력된 닉네임이 현재 사용자의 닉네임과 같다면 사용 가능(중복 아님)
	    if (userNickname.equals(currentNickname)) {
	        return 0;
	    }
	    
	    // 다른 사용자의 닉네임과 중복 체크
	    int result = service.updateNickname(userNickname);
	    return result;
		
	}
	
	/** 전화번호 중복 검사
     * @param userTel : 입력한 전화번호
     * @param currentTel : 현재 사용자의 전화번호
     * @return 중복이면 1, 아니면 0
     */
	@GetMapping("/verifyTel")
	@ResponseBody
	public ResponseEntity<Integer> checkTel(@RequestParam("userTel") String userTel, 
            @RequestParam("currentTel") String currentTel) {
	    // 현재 전화번호와 동일한 경우
	    if (userTel.equals(currentTel)) {
	        return ResponseEntity.ok(0); // 중복 아님을 나타내는 0 반환
	    }
	    
	    int result = service.checkTel(userTel);
	    return ResponseEntity.ok(result); // ResponseEntity로 감싸서 반환
	}


	/** 회원정보 수정
	 * @param member
	 * @param loginMember
	 * @return
	 */
	@PostMapping("/updateInfo")
	@ResponseBody
	public int updateMember(@RequestBody Member member, @SessionAttribute("loginMember") Member loginMember) {

		// 로그 추가
		log.info("Received member update request: {}", member);

		// 현재 로그인한 회원의 번호를 설정
		member.setMemberNo(loginMember.getMemberNo());

		int result = service.updateMember(member);

		// 업데이트 성공 시 세션 정보도 업데이트
		if (result > 0) {
			loginMember.setMemberEmail(member.getMemberEmail());
			loginMember.setMemberNickname(member.getMemberNickname());
			loginMember.setMemberTel(member.getMemberTel());
			loginMember.setMemberGender(member.getMemberGender());
		}

		return result;
	}
	
	

	/**
	 * 
	 * @return
	 * @author 나찬웅
	 */
	@GetMapping("mypageInfo")
	public String mypageInfo() {
		return "mypage/mypageInfo"; // (예매내역/찜목록) 관리 페이지 HTML 파일
	}

	/**
	 * 1/6  마이페이지 -> 예매 내역
	 * 
	 * @return
	 * @author 나찬웅
	 */
	@GetMapping("ticketInfo")
	public String ticketInfo() {
		return "mypage/ticketInfo"; // 예매내역 페이지 HTML 파일
	}

	/**
	 * 예매 내역 조회
	 * 
	 * @param bookingId
	 * @param loginMember
	 * @return
	 * @author 나찬웅
	 */
	@GetMapping("/ticketInfo/data")
	public ResponseEntity<List<ticketInfoDTO>> getBookingHistory(@SessionAttribute("loginMember") Member loginMember,
																 @RequestParam(value = "status", required = false, defaultValue = "ALL") String status,
															     @RequestParam(value = "bookingId", required = false) String bookingId,
															     @RequestParam(value = "startDate", required = false) String startDate,
															     @RequestParam(value = "endDate", required = false) String endDate
															     ) {
		List<ticketInfoDTO> bookingHistory = service.getBookingHistory(loginMember.getMemberNo(), status, bookingId, startDate, endDate);
		return ResponseEntity.ok(bookingHistory);
	}

	/**
	 * 1/6  마이페이지 -> 예매 내역 -> 예매 상세 정보
	 * 
	 * @return
	 * @author 나찬웅
	 * 
	/** 예매 상세 정보 페이지로 이동 */
	@GetMapping("ticketDetail/{bookingId}")
	public String ticketDetail(@PathVariable("bookingId") String bookingId) {
		return "mypage/ticketDetail"; // 예매 내역 상세 페이지 HTML
	}


	/** 1/6 예매 상세 정보에서 데이터 조회
	 * @param bookingId
	 * @param loginMember
	 * @return
	 * @author 나찬웅
	 */
	@ResponseBody
	@GetMapping("ticketDetail/data/{bookingId}")
	public ResponseEntity<ticketInfoDTO> getTicketDetail(@PathVariable("bookingId") String bookingId,
			@SessionAttribute("loginMember") Member loginMember) {

		ticketInfoDTO detail = service.getBookingDetail(bookingId, loginMember.getMemberNo());
		
		if (detail != null) {
	        return ResponseEntity.ok(detail);  // 정상적으로 JSON 반환
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);  // 데이터를 찾지 못했을 때
	    }
	}

	/**
	 * 마이페이지 -> 찜목록
	 * 
	 * @return
	 * @author 나찬웅
	 */
	@GetMapping("favList")
	public String favList() {
		return "mypage/favList"; // 찜목록 페이지 HTML 파일
	}
	
	/** 예매 취소(결제, 예약정보, 예매 내역, 좌석)테이블 수정 및 삭제
	 * @param bookingId
	 * @param loginMember
	 * @return
	 * @author 나찬웅
	 */
	@ResponseBody
	@PostMapping("cancelBooking")
	public ResponseEntity<String> cancelBooking(@RequestParam("bookingId") String bookingId,
												@SessionAttribute("loginMember") Member loginMember) {
		try {
			log.info("취소 요청된 예매 번호: {}", bookingId); // 로그 출력
			boolean result = service.cancelBooking(bookingId, loginMember.getMemberNo());
			

			
			if(result) {
				return ResponseEntity.ok("예매가 취소되었습니다.");
			} else {
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("예매 취소에 실패했습니다.");
			}
		} catch (Exception e) {
			log.error("예매 취소 중 오류 발생: ", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류 발생");
		}
	}
	
	
	/**
	 * @param loginMember
	 * @author 나찬웅
	 * @return
	 */
	@GetMapping("defaultAddress")
	@ResponseBody
	public ResponseEntity<AddressDTO> getDefaultAddress(@SessionAttribute("loginMember")Member loginMember){
		    AddressDTO defaultAddress = service.getDefaultAddress(loginMember.getMemberNo()); // 기본 배송지 가져오기
		    
		    if (defaultAddress != null) {
		        return ResponseEntity.ok(defaultAddress); // 기본 배송지 반환
		    } else  {
		    	 return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
		    }
	}
	
}
