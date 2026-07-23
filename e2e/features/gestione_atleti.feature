Feature: Gestione Atleti
  Come istruttore
  Voglio poter gestire l'anagrafica degli atleti
  Affinché io possa tener traccia dei praticanti nel dojo

  Scenario: Inserimento nuovo atleta
    Given che mi trovo sulla dashboard di KarateFlow
    When navigo nella sezione Atleti
    And avvio la procedura di creazione nuovo atleta
    And compilo i dati anagrafici con nome "Gichin", cognome "Funakoshi" e data "1868-11-10"
    Then il sistema deve procedere con la registrazione
