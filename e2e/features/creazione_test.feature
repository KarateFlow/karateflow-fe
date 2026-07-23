Feature: Creazione Test Fisico
  Come istruttore
  Voglio creare e valutare una sessione di test
  Affinché io possa tracciare i progressi dell'atleta

  Scenario: Inserimento e salvataggio di un test fisico
    Given che mi trovo sulla pagina di creazione test
    When compilo la tipologia del test con "Kihon Valutativo" e data "2026-07-23T10:00"
    And aggiungo un esercizio alla scheda
    And confermo il salvataggio della sessione
    Then la sessione viene registrata correttamente
