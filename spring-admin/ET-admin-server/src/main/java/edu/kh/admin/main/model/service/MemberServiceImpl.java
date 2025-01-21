package edu.kh.admin.main.model.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.kh.admin.main.model.dto.Member;
import edu.kh.admin.main.model.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class MemberServiceImpl implements MemberService{

		private final MemberMapper mapper;
		
		@Override
		public List<Member> showMemberList() {
		List<Member> list = mapper.showMemberList();
		
		for (Member member : list) {
		   //String rawAddress = member.getMemberAddress();
		    String formalTel = member.getMemberTel();
		    
//		    if (rawAddress != null) {
//		        String formattedAddress = rawAddress.replace("^^^", " "); 
//		        member.setMemberAddress(formattedAddress); 
//		    }
		    
		    if (formalTel != null && formalTel.length() == 11) {
		    	String areaCode = formalTel.substring(0, 3);
		    	String middlePart = formalTel.substring(3, 7); 
		    	String lastPart = formalTel.substring(7); 
		    	
		    	member.setMemberTel(areaCode + "-" + middlePart + "-" + lastPart);  
		    }
		}
		return list;
		}
	
		@Override
		public List<Member> searchShowMemberList(Map<String, Object> formdata) {
			List<Member> list = mapper.searchShowMemberList(formdata);
			
			for (Member member : list) {
			    //String rawAddress = member.getMemberAddress();
			    String formalTel = member.getMemberTel();
			    
//			    if (rawAddress != null) {
//			        String formattedAddress = rawAddress.replace("^^^", " "); 
//			        member.setMemberAddress(formattedAddress); 
//			    }
			    
			    if (formalTel != null && formalTel.length() == 11) {
			    	String areaCode = formalTel.substring(0, 3);
			    	String middlePart = formalTel.substring(3, 7); 
			    	String lastPart = formalTel.substring(7); 
			    	
			    	member.setMemberTel(areaCode + "-" + middlePart + "-" + lastPart);  
			    }
			}
			return list;
		}
		
		@Override
		public List<Member> memberDetail(int memberNo) {
		    List<Member> members = mapper.memberDetail(memberNo);  // DB에서 회원 정보 가져오기

		    for (Member member : members) {
		        // 주소에서 ^^^을 공백으로 치환
//		        if (member.getMemberAddress() != null) {
//		            String updatedAddress = member.getMemberAddress().replaceAll("\\^\\^\\^", " ");
//		            member.setMemberAddress(updatedAddress);
//		        }
		        
		        
		        // 전화번호 가공: '01012345678' -> '010-1234-5678' 형태로
		        if (member.getMemberTel() != null) {
		            String phone = member.getMemberTel();
		            if (phone.length() == 11) {
		                String formattedPhone = phone.substring(0, 3) + "-" + phone.substring(3, 7) + "-" + phone.substring(7);
		                member.setMemberTel(formattedPhone);
		            }
		        }
		    }
		    
		    return members;
		}
		
		
		@Override
		public int delete(int memberNo) {
		return mapper.delete(memberNo);
		}

		// 이메일, 회원번호로 관리자 확인
		@Override
		public Member findByEmail(String memberEmail, String memberNo) {
			Map<String, Object> paramMap = new HashMap<>();
			
			paramMap.put("memberEmail", memberEmail);
			paramMap.put("memberNo", memberNo);
			
			return mapper.findByEmail(paramMap);
		}
		
		
		@Override
		public int update(@Param("map") Map<String, Object> formdata, @Param("no") int memberNo) {
			 // 주소와 전화번호 데이터 가져오기
		    //String address = (String) formdata.get("memberAddress");
		    String tel = (String) formdata.get("memberTel");

//		    if (address != null) {
//		        // 우편번호(5자리) + 공백 + 기본주소 + 공백 + 상세주소 형식 가정
//		        String[] addressParts = address.split("\\s+", 3); // 최대 3부분으로 분할
//		        if (addressParts.length >= 2) {
//		            String zipcode = addressParts[0];  // 우편번호
//		            String baseAddress = addressParts[1];  // 기본 주소
//		            String detailAddress = addressParts.length > 2 ? addressParts[2] : ""; // 상세주소 (없을 수 있음)
//		            
//		            // 우편번호^^^기본주소^^^상세주소 형식으로 조합
//		            String formattedAddress = zipcode + "^^^" + baseAddress + (detailAddress.isEmpty() ? "" : "^^^" + detailAddress);
//		            formdata.put("memberAddress", formattedAddress);
//		        }
//		    }

		    if (tel != null) {
		        // 전화번호의 하이픈 제거
		        String formattedTel = tel.replaceAll("-", "");
		        formdata.put("memberTel", formattedTel);
		    }
		    formdata.put("memberNo", memberNo);

		    return mapper.update(formdata);
		}
		
		
		
		
		
		
		
		
}
