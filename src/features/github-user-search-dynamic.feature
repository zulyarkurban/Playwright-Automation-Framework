Feature: Dynamic GitHub User Search and Repository Exploration
  As a user
  I want to search for different GitHub users dynamically
  So that I can test various user profiles and repository structures

  Background:
    Given I navigate to the GitHub user search application

  Scenario Outline: Search for multiple users with different profiles
    When I search for user "<username>"
    And I click on the GitHub profile link
    And I click on the repositories section
    Then I should see all public repositories
    And I print out all public repository names

    Examples:
      | username     |
      | zulyarkurban |
      | octocat      |
      | torvalds     |
      | microsoft    |
      | facebook     |
      
  @data-driven
  Scenario: Search using external data file
    When I search for a user from the test data file
    And I click on the GitHub profile link
    And I click on the repositories section
    Then I should see all public repositories
    And I print out all public repository names

  @environment
  Scenario: Search using environment-specific user
    When I search for the default user for current environment
    And I click on the GitHub profile link
    And I click on the repositories section
    Then I should see all public repositories
    And I print out all public repository names