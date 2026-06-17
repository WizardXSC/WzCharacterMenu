RegisterNetEvent('wz-charactermenu:requestOpen')
AddEventHandler('wz-charactermenu:requestOpen', function()
    local src = source
    local hasPedAccess = false

    if Config.CustomPedsAllowAll then
        hasPedAccess = true
    else
        local steamHex = nil
        for _, id in ipairs(GetPlayerIdentifiers(src)) do
            if string.sub(id, 1, 6) == "steam:" then
                steamHex = string.lower(id)
                break
            end
        end

        if steamHex then
            for _, allowed in ipairs(Config.CustomPedAccess) do
                if string.lower(allowed) == steamHex then
                    hasPedAccess = true
                    break
                end
            end
        end
    end

    TriggerClientEvent('wz-charactermenu:openMenu', src, hasPedAccess)
end)
