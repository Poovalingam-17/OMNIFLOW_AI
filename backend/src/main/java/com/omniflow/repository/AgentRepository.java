package com.omniflow.repository;

import com.omniflow.model.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {
    List<Agent> findByIsActiveTrue();
    List<Agent> findByDomain(String domain);
    Optional<Agent> findByName(String name);
}
