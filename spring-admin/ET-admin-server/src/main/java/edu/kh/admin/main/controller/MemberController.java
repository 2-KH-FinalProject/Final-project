package edu.kh.admin.main.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

import edu.kh.admin.main.model.dto.Member;
import edu.kh.admin.main.model.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController 
@CrossOrigin( origins = "http://localhost:3000",
			  allowedHeaders = "*",
			  allowCredentials = "true",
			  methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
				           RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequestMapping("member")
@RequiredArgsConstructor
@Slf4j
@SessionAttributes({ "loginMember" })
public class MemberController {

	private final MemberService service;
	
	@GetMapping("showMemberList")
	public ResponseEntity<Object> showMemberList() {
		List<Member> showMemberList = service.showMemberList();
		try {
			return ResponseEntity.status(HttpStatus.OK).body(showMemberList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}
	
	@PostMapping("searchShowMemberList")
	public ResponseEntity<Object> searchShowMemberList(@RequestBody Map<String, Object> formdata)  {
		
		
		List<Member> searchShowMemberList = service.searchShowMemberList(formdata);
		
		log.info(formdata.toString());
		log.info(searchShowMemberList.toString());

		
		try {
			return ResponseEntity.status(HttpStatus.OK).body(searchShowMemberList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}
	
	
	@GetMapping("/{memberNo:[0-9]+}")
	public ResponseEntity<Object> getDetail(@PathVariable("memberNo") int memberNo) {
	    List<Member> member = service.memberDetail(memberNo);
	    if (member != null) {
	        return ResponseEntity.ok(member);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}

	@PostMapping("delete/{memberNo:[0-9]+}")
	public ResponseEntity<Object> delete(@PathVariable("memberNo") int memberNo) {
	    int result = service.delete(memberNo);
	    if (result > 0) {
	        return ResponseEntity.ok(result);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}
	
	@PostMapping("update/{memberNo:[0-9]+}")
	public ResponseEntity<Object> update(@RequestBody Map<String, Object> formdata,@PathVariable("memberNo") int memberNo) {
		int result = service.update(formdata,memberNo);
	    if (result > 0) {
	        return ResponseEntity.ok(result);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
}
