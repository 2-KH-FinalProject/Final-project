package edu.kh.project.performance.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class Performance {
	
	private String mt20id;			// 공연아이디
	private String prfnm; 			// 공연이름
	private String prfpdfrom; 		// 공연시작날짜
	private String prfpdto; 		// 공연종료날짜
	private String fcltynm;  		// 공연장소
	private String prfcast;			// 출연진
	private String prfruntime;		// 공연시간
	private String entrpsnm;		// 공연기획사
	private String pcseguidance;	// 공연가격
	private String poster;			// 공연포스터
	private String dtguidance;		// 공연기간
	private String area;			// 공연지역
	private String genrenm;			// 공연장르
	private String prfstate;		// 공연상태
	private String mt10id;			// 공연시설
	private String styurl;			// 소개이미지
	
	

}
