package com.golden_dobakhe.HakPle.domain.resource.image.service;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardRepository;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileService {

    @Value("${file.upload-dir:${user.home}/hakple-uploads}")
    private String uploadDir;

    @Value("${server.port}")
    private String serverPort;
    
    private final ImageRepository imageRepository;
    private final BoardRepository boardRepository;
    
    public FileService(ImageRepository imageRepository, BoardRepository boardRepository) {
        this.imageRepository = imageRepository;
        this.boardRepository = boardRepository;
    }

    public String saveFile(MultipartFile file) {
        return saveFile(file, false, null);
    }
    
    public String saveFile(MultipartFile file, boolean saveEntity) {
        return saveFile(file, saveEntity, null);
    }
    
    /**
     * 임시 식별자(tempId)를 사용하여 파일을 저장하고 결과를 Map으로 반환합니다.
     */
    public Map<String, Object> saveFileWithTempId(MultipartFile file, boolean saveEntity, Long boardId, String tempId) {
        try {
            // 파일 저장 경로 준비
            String absoluteUploadPath = prepareUploadPath();
            Path directoryPath = Paths.get(absoluteUploadPath);
            Files.createDirectories(directoryPath);
            
            // 파일명 생성 및 저장
            String fileName = generateFileName(file);
            Path filePath = directoryPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            // URL 생성
            String fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(fileName)
                    .toUriString();
            
            // 이미지 엔티티 저장 (필요한 경우)
            Long imageId = null;
            if (saveEntity) {
                Image image = Image.builder()
                    .filePath(fileUrl)
                    .tempId(tempId)
                    .build();
                
                // 게시글 연결 (boardId가 있는 경우)
                if (boardId != null) {
                    Optional<Board> boardOpt = boardRepository.findById(boardId);
                    if (boardOpt.isPresent()) {
                        image.setBoard(boardOpt.get());
                    }
                }
                
                Image savedImage = imageRepository.save(image);
                imageId = savedImage.getId();
            }
            
            // 결과 맵 생성
            Map<String, Object> result = new HashMap<>();
            result.put("filePath", fileUrl);
            result.put("tempId", tempId);
            if (imageId != null) {
                result.put("imageId", imageId);
            }
            
            return result;
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * 임시 이미지들을 게시글에 연결합니다.
     */
    @Transactional
    public int linkImagesToBoard(List<String> tempIds, Long boardId) {
        if (tempIds == null || tempIds.isEmpty() || boardId == null) {
            return 0;
        }
        
        // 게시글 존재 확인
        if (!boardRepository.existsById(boardId)) {
            throw new RuntimeException("게시글이 존재하지 않습니다: " + boardId);
        }
        
        // 임시 이미지 목록 조회
        List<Image> images = imageRepository.findByTempIdIn(tempIds);
        Board board = boardRepository.findById(boardId).orElseThrow();
        
        // 각 이미지에 게시글 연결
        for (Image image : images) {
            image.setBoard(board);
        }
        
        // 변경된 이미지 저장
        imageRepository.saveAll(images);
        
        return images.size();
    }
    
    /**
     * 기존 메서드를 유지하되 새로운 메서드를 호출하도록 수정
     */
    public String saveFile(MultipartFile file, boolean saveEntity, Long boardId) {
        Map<String, Object> result = saveFileWithTempId(file, saveEntity, boardId, UUID.randomUUID().toString());
        return (String) result.get("filePath");
    }
    
    // 업로드 경로 준비
    private String prepareUploadPath() {
        String absoluteUploadPath;
        
        // uploadDir이 상대 경로인 경우 절대 경로로 변환
        if (uploadDir.startsWith("./") || uploadDir.startsWith(".\\")) {
            // 사용자 홈 디렉토리 기반으로 변경
            String userHome = System.getProperty("user.home");
            absoluteUploadPath = userHome + "/hakple-uploads";
        } else {
            absoluteUploadPath = uploadDir;
        }
        
        // 디버깅 정보 출력
        System.out.println("업로드 디렉토리: " + Paths.get(absoluteUploadPath).toAbsolutePath());
        
        return absoluteUploadPath;
    }
    
    // 파일명 생성
    private String generateFileName(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        return UUID.randomUUID().toString() + extension;
    }
}
