Config = {}

Config.DefaultOpenKey = 'M'

Config.OpenCommand = 'charactermenu'

Config.FreemodePeds = {
    { label = "Male (Freemode)",   model = "mp_m_freemode_01" },
    { label = "Female (Freemode)", model = "mp_f_freemode_01" }
}

Config.CustomPeds = {
    { label = "Michael",        model = "player_zero" },
    { label = "Franklin",       model = "player_one" },
    { label = "Trevor",         model = "player_two" },
    { label = "Space Ranger",   model = "s_m_m_movspace_01" },
    { label = "Alien",          model = "s_m_m_movalien_01" },
    { label = "Pranger",        model = "s_m_m_pranger_01" },
    { label = "Security Guard", model = "s_m_m_security_01" },
    { label = "Street Clean",   model = "s_m_m_snowcop_01" },
    { label = "Pogo the Clown", model = "s_m_m_clown_01" },
    { label = "VIP Guard",      model = "s_m_m_highsec_01" }
}

Config.CustomPedsAllowAll = false

Config.CustomPedAccess = {
    "steam:1100001abcdef12",
}

Config.Locale = 'en'

Config.Locales = {
    ['en'] = {
        ['menu_title'] = "Character Menu",
        ['menu_subtitle'] = "CHARACTER SYSTEM",
        ['create_new'] = "Create New Character",
        ['saved_chars'] = "Saved Characters",
        ['appearance'] = "Character Appearance",
        ['import_char'] = "Import Character Code",
        ['receive_sharing'] = "Receive Sharing Code",
        ['custom_peds'] = "Custom Peds",
        ['settings'] = "Settings",
        ['footer_text'] = "Press SPACE to rotate character 180°",
        ['import_code_placeholder'] = "Enter base64 share code...",
        ['character_name_placeholder'] = "Enter character name...",
        ['save_btn'] = "Save Character",
        ['apply_btn'] = "Apply Character",
        ['delete_btn'] = "Delete Character",
        ['share_btn'] = "Get Share Code",
        ['no_saved_chars'] = "No saved characters found.",
        ['import_invalid'] = "Invalid share code!",
        ['import_success'] = "Character imported successfully!",
        ['save_success'] = "Character saved successfully!",
        ['delete_success'] = "Character deleted successfully!",
        ['back_btn'] = "Back"
    },
    ['gr'] = {
        ['menu_title'] = "Μενού Χαρακτήρα",
        ['menu_subtitle'] = "ΣΥΣΤΗΜΑ ΧΑΡΑΚΤΗΡΩΝ",
        ['create_new'] = "Δημιουργία Νέου Χαρακτήρα",
        ['saved_chars'] = "Αποθηκευμένοι Χαρακτήρες",
        ['appearance'] = "Εμφάνιση Χαρακτήρα",
        ['import_char'] = "Εισαγωγή Κωδικού Χαρακτήρα",
        ['receive_sharing'] = "Λήψη Κωδικού Κοινής Χρήσης",
        ['custom_peds'] = "Ειδικά Peds",
        ['settings'] = "Ρυθμίσεις",
        ['footer_text'] = "Πατήστε SPACE για περιστροφή χαρακτήρα 180°",
        ['import_code_placeholder'] = "Εισάγετε τον κωδικό base64...",
        ['character_name_placeholder'] = "Όνομα Χαρακτήρα...",
        ['save_btn'] = "Αποθήκευση Χαρακτήρα",
        ['apply_btn'] = "Εφαρμογή Χαρακτήρα",
        ['delete_btn'] = "Διαγραφή Χαρακτήρα",
        ['share_btn'] = "Κωδικός Κοινής Χρήσης",
        ['no_saved_chars'] = "Δεν βρέθηκαν αποθηκευμένοι χαρακτήρες.",
        ['import_invalid'] = "Μη έγκυρος κωδικός!",
        ['import_success'] = "Ο χαρακτήρας εισήχθη με επιτυχία!",
        ['save_success'] = "Ο χαρακτήρας αποθηκεύτηκε επιτυχώς!",
        ['delete_success'] = "Ο χαρακτήρας διαγράφηκε επιτυχώς!",
        ['back_btn'] = "Πίσω"
    }
}

function _U(str)
    if Config.Locales[Config.Locale] and Config.Locales[Config.Locale][str] then
        return Config.Locales[Config.Locale][str]
    end
    return str
end
