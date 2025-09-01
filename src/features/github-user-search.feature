Feature: GitHub User Search and Repository Exploration
  As a user
  I want to search for GitHub users and explore their repositories
  So that I can discover and follow interesting developers

  Scenario Outline: Search for user and explore their repositories
    Given I navigate to the GitHub user search application
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

  Scenario: Search for specific user with validation
    Given I navigate to the GitHub user search application
    When I search for user "microsoft"
    And I click on the GitHub profile link
    And I click on the repositories section
    Then I should see all public repositories
    And I print out all public repository names