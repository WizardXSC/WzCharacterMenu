local isMenuOpen = false

function GetPedComponentsData(ped)
    local data = {
        model = GetEntityModel(ped),
        components = {},
        props = {},
        hairColor = 0,
        hairHighlightColor = 0,
        headBlend = {}
    }

    local success, shapeFirst, shapeSecond, shapeThird, skinFirst, skinSecond, skinThird, shapeMix, skinMix, thirdMix =
        pcall(function()
            return GetPedHeadBlendData(ped)
        end)

    if success and shapeFirst then
        data.headBlend = {
            shapeFirst = shapeFirst,
            shapeSecond = shapeSecond,
            shapeThird = shapeThird,
            skinFirst = skinFirst,
            skinSecond = skinSecond,
            skinThird = skinThird,
            shapeMix = shapeMix,
            skinMix = skinMix,
            thirdMix = thirdMix
        }
    else
        data.headBlend = {
            shapeFirst = 0,
            shapeSecond = 0,
            shapeThird = 0,
            skinFirst = 0,
            skinSecond = 0,
            skinThird = 0,
            shapeMix = 0.0,
            skinMix = 0.0,
            thirdMix = 0.0
        }
    end

    for i = 0, 11 do
        local drawable = GetPedDrawableVariation(ped, i)
        local texture = GetPedTextureVariation(ped, i)
        local maxDrawable = GetNumberOfPedDrawableVariations(ped, i) - 1
        local maxTexture = 0
        if maxDrawable >= 0 then
            maxTexture = GetNumberOfPedTextureVariations(ped, i, drawable) - 1
        end

        data.components[tostring(i)] = {
            drawable = drawable,
            texture = texture,
            maxDrawable = maxDrawable,
            maxTexture = maxTexture
        }
    end

    for i = 0, 7 do
        local drawable = GetPedPropIndex(ped, i)
        local texture = GetPedPropTextureIndex(ped, i)
        local maxDrawable = GetNumberOfPedPropDrawableVariations(ped, i) - 1
        local maxTexture = 0
        if drawable ~= -1 and maxDrawable >= 0 then
            maxTexture = GetNumberOfPedPropTextureVariations(ped, i, drawable) - 1
        end

        data.props[tostring(i)] = {
            drawable = drawable,
            texture = texture,
            maxDrawable = maxDrawable,
            maxTexture = maxTexture
        }
    end

    return data
end

function GetSavedCharacters()
    local listStr = GetResourceKvpString("wz_char_list")
    if listStr then
        local success, decoded = pcall(json.decode, listStr)
        if success then
            return decoded or {}
        end
    end
    return {}
end

function SaveCharacter(name, appearanceData)
    local list = GetSavedCharacters()
    local exists = false
    for _, v in ipairs(list) do
        if v == name then
            exists = true
            break
        end
    end

    if not exists then
        table.insert(list, name)
        SetResourceKvp("wz_char_list", json.encode(list))
    end

    SetResourceKvp("wz_char_data_" .. name, json.encode(appearanceData))
end

function DeleteCharacter(name)
    local list = GetSavedCharacters()
    local newList = {}
    for _, v in ipairs(list) do
        if v ~= name then
            table.insert(newList, v)
        end
    end
    SetResourceKvp("wz_char_list", json.encode(newList))
    DeleteResourceKvp("wz_char_data_" .. name)
end

local charCamera = nil
local currentCamType = "default"
local initialHeading = 0.0

function CreateCustomCamera()
    local playerPed = PlayerPedId()

    ClearPedTasksImmediately(playerPed)
    SetPedCanPlayAmbientAnims(playerPed, false)
    SetPedCanPlayGestureAnims(playerPed, false)
    SetPedCanUseAutoConversationLookat(playerPed, false)
    TaskStandStill(playerPed, -1)
    FreezeEntityPosition(playerPed, true)

    local coords = GetEntityCoords(playerPed)
    initialHeading = GetEntityHeading(playerPed)

    local angle = math.rad(initialHeading)
    local distance = 1.8
    local camX = coords.x + (distance * math.sin(-angle))
    local camY = coords.y + (distance * math.cos(-angle))
    local camZ = coords.z + 0.2

    charCamera = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    SetCamCoord(charCamera, camX, camY, camZ)
    PointCamAtCoord(charCamera, coords.x, coords.y, coords.z + 0.1)
    SetCamActive(charCamera, true)
    RenderScriptCams(true, true, 500, true, true)
    currentCamType = "default"
end

function UpdateCustomCamera(camType)
    if not charCamera then return end
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local angle = math.rad(initialHeading)

    local distance, heightOffset, pointHeight
    if camType == "head" then
        distance = 0.9
        heightOffset = 0.6
        pointHeight = 0.6
    elseif camType == "feet" then
        distance = 1.0
        heightOffset = -0.5
        pointHeight = -0.65
    else
        distance = 1.8
        heightOffset = 0.2
        pointHeight = 0.1
    end

    local camX = coords.x + (distance * math.sin(-angle))
    local camY = coords.y + (distance * math.cos(-angle))
    local camZ = coords.z + heightOffset

    local tempCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    SetCamCoord(tempCam, camX, camY, camZ)
    PointCamAtCoord(tempCam, coords.x, coords.y, coords.z + pointHeight)
    SetCamActiveWithInterp(tempCam, charCamera, 600, 1, 1)

    CreateThread(function()
        Wait(600)
        if charCamera then
            DestroyCam(charCamera, true)
            charCamera = tempCam
        end
    end)

    currentCamType = camType
end

function DestroyCustomCamera()
    local playerPed = PlayerPedId()
    FreezeEntityPosition(playerPed, false)
    SetPedCanPlayAmbientAnims(playerPed, true)
    SetPedCanPlayGestureAnims(playerPed, true)
    SetPedCanUseAutoConversationLookat(playerPed, true)
    ClearPedTasks(playerPed)

    if charCamera then
        SetCamActive(charCamera, false)
        DestroyCam(charCamera, true)
        RenderScriptCams(false, true, 500, true, true)
        charCamera = nil
    end
end

local hasCustomPedAccess = false

function ToggleMenu()
    if isMenuOpen then
        isMenuOpen = false
        SetNuiFocus(false, false)
        SendNUIMessage({
            action = "close"
        })
        DestroyCustomCamera()
    else
        TriggerServerEvent('wz-charactermenu:requestOpen')
    end
end

RegisterNetEvent('wz-charactermenu:openMenu')
AddEventHandler('wz-charactermenu:openMenu', function(access)
    if isMenuOpen then return end
    isMenuOpen = true
    hasCustomPedAccess = access
    SetNuiFocus(true, false)
    CreateCustomCamera()

    local ped = PlayerPedId()
    local componentsData = GetPedComponentsData(ped)
    local savedCharsList = GetSavedCharacters()

    SendNUIMessage({
        action = "open",
        config = {
            FreemodePeds = Config.FreemodePeds,
            CustomPeds = Config.CustomPeds,
            Locale = Config.Locale,
            Locales = Config.Locales,
            HasCustomPedAccess = access
        },
        components = componentsData,
        saved = savedCharsList
    })
end)

RegisterCommand(Config.OpenCommand, function()
    ToggleMenu()
end, false)

RegisterKeyMapping(Config.OpenCommand, 'Toggle Character Menu', 'keyboard', Config.DefaultOpenKey)

CreateThread(function()
    while true do
        if isMenuOpen then
            Wait(0)
            DisableAllControlActions(0)

            EnableControlAction(0, 249, true)
            EnableControlAction(0, 18, true)

            if IsDisabledControlJustPressed(0, 22) then
                local ped = PlayerPedId()
                local heading = GetEntityHeading(ped)
                SetEntityHeading(ped, heading + 180.0)
            end
        else
            Wait(250)
        end
    end
end)

function ApplyAppearance(data)
    local ped = PlayerPedId()

    local targetModel = data.model
    if targetModel then
        local currentModel = GetEntityModel(ped)
        local modelHash = tonumber(targetModel) or GetHashKey(targetModel)

        if currentModel ~= modelHash then
            if IsModelInCdimage(modelHash) and IsModelValid(modelHash) then
                RequestModel(modelHash)
                while not HasModelLoaded(modelHash) do
                    Wait(0)
                end
                SetPlayerModel(PlayerId(), modelHash)
                SetModelAsNoLongerNeeded(modelHash)
                ped = PlayerPedId()
                SetPedDefaultComponentVariation(ped)

                ClearPedTasksImmediately(ped)
                SetPedCanPlayAmbientAnims(ped, false)
                SetPedCanPlayGestureAnims(ped, false)
                SetPedCanUseAutoConversationLookat(ped, false)
                TaskStandStill(ped, -1)
                FreezeEntityPosition(ped, true)

                Wait(100)
                SendNUIMessage({
                    action = "updateComponents",
                    components = GetPedComponentsData(ped)
                })
            end
        end
    end

    if data.components then
        for k, v in pairs(data.components) do
            local compId = tonumber(k)
            local drawable = tonumber(v.drawable)
            local texture = tonumber(v.texture)
            if compId then
                SetPedComponentVariation(ped, compId, drawable, texture, 0)
            end
        end
    end

    if data.props then
        for k, v in pairs(data.props) do
            local propId = tonumber(k)
            local drawable = tonumber(v.drawable)
            local texture = tonumber(v.texture)
            if propId then
                if drawable == -1 then
                    ClearPedProp(ped, propId)
                else
                    SetPedPropIndex(ped, propId, drawable, texture, true)
                end
            end
        end
    end

    if data.hairColor and data.hairHighlightColor then
        SetPedHairColor(ped, tonumber(data.hairColor), tonumber(data.hairHighlightColor))
    end

    if data.headBlend and data.headBlend.shapeFirst then
        SetPedHeadBlendData(
            ped,
            tonumber(data.headBlend.shapeFirst or 0),
            tonumber(data.headBlend.shapeSecond or 0),
            tonumber(data.headBlend.shapeThird or 0),
            tonumber(data.headBlend.skinFirst or 0),
            tonumber(data.headBlend.skinSecond or 0),
            tonumber(data.headBlend.skinThird or 0),
            tonumber(data.headBlend.shapeMix or 0.0),
            tonumber(data.headBlend.skinMix or 0.0),
            tonumber(data.headBlend.thirdMix or 0.0),
            false
        )
    end
end

RegisterNUICallback('close', function(data, cb)
    isMenuOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = "close"
    })
    DestroyCustomCamera()
    cb('ok')
end)

RegisterNUICallback('changeCamType', function(data, cb)
    local camType = data.type
    UpdateCustomCamera(camType)
    cb('ok')
end)

RegisterNUICallback('rotatePed', function(data, cb)
    local ped = PlayerPedId()
    local heading = GetEntityHeading(ped)
    SetEntityHeading(ped, heading + 180.0)
    cb('ok')
end)

RegisterNUICallback('changeComponent', function(data, cb)
    local ped = PlayerPedId()
    local compId = tonumber(data.compId)
    local drawable = tonumber(data.drawable)
    local texture = tonumber(data.texture)

    if compId then
        SetPedComponentVariation(ped, compId, drawable, texture, 0)
        local maxTexture = GetNumberOfPedTextureVariations(ped, compId, drawable) - 1
        cb({ maxTexture = maxTexture })
    else
        cb('error')
    end
end)

RegisterNUICallback('changeProp', function(data, cb)
    local ped = PlayerPedId()
    local propId = tonumber(data.propId)
    local drawable = tonumber(data.drawable)
    local texture = tonumber(data.texture)

    if propId then
        if drawable == -1 then
            ClearPedProp(ped, propId)
            cb({ maxTexture = 0 })
        else
            SetPedPropIndex(ped, propId, drawable, texture, true)
            local maxTexture = GetNumberOfPedPropTextureVariations(ped, propId, drawable) - 1
            cb({ maxTexture = maxTexture })
        end
    else
        cb('error')
    end
end)

RegisterNUICallback('changeModel', function(data, cb)
    local targetModel = data.model
    if targetModel then
        local isCustomPed = false
        for _, ped in ipairs(Config.CustomPeds) do
            if ped.model == targetModel then
                isCustomPed = true
                break
            end
        end

        if isCustomPed and not hasCustomPedAccess then
            cb('error')
            return
        end

        local modelHash = tonumber(targetModel) or GetHashKey(targetModel)
        if IsModelInCdimage(modelHash) and IsModelValid(modelHash) then
            RequestModel(modelHash)
            while not HasModelLoaded(modelHash) do
                Wait(0)
            end
            SetPlayerModel(PlayerId(), modelHash)
            SetModelAsNoLongerNeeded(modelHash)
            local ped = PlayerPedId()
            SetPedDefaultComponentVariation(ped)

            ClearPedTasksImmediately(ped)
            SetPedCanPlayAmbientAnims(ped, false)
            SetPedCanPlayGestureAnims(ped, false)
            SetPedCanUseAutoConversationLookat(ped, false)
            TaskStandStill(ped, -1)
            FreezeEntityPosition(ped, true)
            cb({ components = GetPedComponentsData(ped) })
        else
            cb('error')
        end
    else
        cb('error')
    end
end)

RegisterNUICallback('changeHairColor', function(data, cb)
    local ped = PlayerPedId()
    local color = tonumber(data.color) or 0
    local highlight = tonumber(data.highlight) or 0
    SetPedHairColor(ped, color, highlight)
    cb('ok')
end)

RegisterNUICallback('changeHeadBlend', function(data, cb)
    local ped = PlayerPedId()
    if data.headBlend then
        SetPedHeadBlendData(
            ped,
            tonumber(data.headBlend.shapeFirst or 0),
            tonumber(data.headBlend.shapeSecond or 0),
            tonumber(data.headBlend.shapeThird or 0),
            tonumber(data.headBlend.skinFirst or 0),
            tonumber(data.headBlend.skinSecond or 0),
            tonumber(data.headBlend.skinThird or 0),
            tonumber(data.headBlend.shapeMix or 0.0),
            tonumber(data.headBlend.skinMix or 0.0),
            tonumber(data.headBlend.thirdMix or 0.0),
            false
        )
    end
    cb('ok')
end)

RegisterNUICallback('saveCharacter', function(data, cb)
    local name = data.name
    local appearance = data.appearance
    if name and appearance then
        SaveCharacter(name, appearance)
        local savedCharsList = GetSavedCharacters()
        cb({ status = "success", saved = savedCharsList })
    else
        cb({ status = "error" })
    end
end)

RegisterNUICallback('deleteCharacter', function(data, cb)
    local name = data.name
    if name then
        DeleteCharacter(name)
        local savedCharsList = GetSavedCharacters()
        cb({ status = "success", saved = savedCharsList })
    else
        cb({ status = "error" })
    end
end)

RegisterNUICallback('loadCharacter', function(data, cb)
    local name = data.name
    if name then
        local charDataStr = GetResourceKvpString("wz_char_data_" .. name)
        if charDataStr then
            local success, decoded = pcall(json.decode, charDataStr)
            if success and decoded then
                ApplyAppearance(decoded)
                cb({ status = "success", components = GetPedComponentsData(PlayerPedId()) })
                return
            end
        end
    end
    cb({ status = "error" })
end)

RegisterNUICallback('importCharacter', function(data, cb)
    local appearance = data.appearance
    if appearance then
        ApplyAppearance(appearance)
        cb({ status = "success", components = GetPedComponentsData(PlayerPedId()) })
    else
        cb({ status = "error" })
    end
end)
