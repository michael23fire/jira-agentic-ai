package com.poc.service;

import com.poc.entity.User;
import com.poc.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    // @Cacheable：第一次呼叫會去 DB 查，結果存進 Redis
    // 之後同樣的 id 再呼叫，直接從 Redis 拿，不會打 DB
    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        log.info(">>> 從 DB 查詢 user id={}", id);  // 如果有 cache，這行不會印出來
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    // 查全部不 cache（資料會變動，不適合 cache）
    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User create(User user) {
        return userRepository.save(user);
    }

    // @CacheEvict：更新或刪除後，把 Redis 裡的舊 cache 清掉
    // 不然 DB 更新了但 Redis 還是舊資料
    @CacheEvict(value = "users", key = "#id")
    public void delete(Long id) {
        log.info(">>> 刪除 user id={}，同時清除 cache", id);
        userRepository.deleteById(id);
    }
}
