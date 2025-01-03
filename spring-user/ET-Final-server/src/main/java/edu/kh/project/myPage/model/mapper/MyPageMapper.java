package edu.kh.project.myPage.model.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import edu.kh.project.member.model.dto.Member;
import edu.kh.project.myPage.model.dto.AddressDTO;

@Mapper
public interface MyPageMapper {
	
    
    /** 암호화된 비밀번호 조회
     * @param memberNo
     * @return encPw
     */
    String selectEncPw(int memberNo);

	/** 회원정보 조회
	 * @param memberNo
	 * @return
	 */
	Member getMemberInfo(int memberNo);

	/** 이메일 중복 체크
	 * @param verificationEmail
	 * @return
	 */
	int verifyEmail(String verificationEmail);

	/** 닉네임 중복검사(수정)
	 * @param userNickname
	 * @return
	 */
	int updateNickname(String userNickname);
	
	/** 비밀번호 변경
	 * @param paramMap
	 * @return
	 */
	int changePw(Map<String, Object> paramMap);

	/** 회원 탈퇴 처리
	 * @param memberNo
	 * @return
	 */
	int membershipOut(int memberNo);
	
	/** 네이버 회원 삭제
	 * @param memberNo
	 * @return
	 */
	int membershipNaverOut(int memberNo);

	/** 해당 회원 비밀번호 조회
	 * @param memberNo
	 * @return
	 */
	String memberPwCheck(int memberNo);

	/** 회원정보 수정
	 * @param member
	 * @return
	 */
	int updateMember(Member member);

	
	
	

	/** 배송지 목록 조회(로드)
	 * @param memberNo
	 * @return
	 */
	List<AddressDTO> selectAddressList(int memberNo);

	
	/** 배송지 추가
	 * @param addressDTO
	 * @return
	 */
	int insertAddress(AddressDTO addressDTO);

	
	/** 중복 주소 체크
	 * @param addressDTO
	 * @param memberNo
	 * @return
	 */
	int countDuplicateAddress(AddressDTO addressDTO, int memberNo);
	
	/** 주소 개수 체크
	 * @param memberNo
	 * @return
	 */
	int getAddressCount(int memberNo);

	
	/**  기본 배송지 등록하기
	 * @param memberNo
	 */
	int resetBasicAddress(int memberNo);
	int basicAddress(int addressNo, int memberNo);

	


	



	
	
	
	

	
}
