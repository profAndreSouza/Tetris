package com.example.tetris;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {
    private final List<Score> scores = new CopyOnWriteArrayList<>();
    private final AtomicLong ids = new AtomicLong();

    @GetMapping
    public List<Score> leaderboard() {
        return scores.stream().sorted(Comparator.comparingInt(Score::score).reversed()
                .thenComparing(Score::createdAt)).limit(10).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Score save(@Valid @RequestBody NewScore body) {
        if (body.name().trim().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome obrigatório");
        Score score = new Score(ids.incrementAndGet(), body.name().trim().substring(0, Math.min(16, body.name().trim().length())),
                body.score(), Instant.now());
        scores.add(score);
        return score;
    }

    public record NewScore(@NotBlank String name, @Min(0) int score) {}
    public record Score(long id, String name, int score, Instant createdAt) {}
}
