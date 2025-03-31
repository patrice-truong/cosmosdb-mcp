$SubscriptionId = "<subscription_id>"   # Azure subscription id
$AccountName = "<cosmosdb_account_name>"    # cosmos db account name
$ResourceGroupName = "rg-cosmosdb" # resource group name of the Cosmos DB account
$PrincipalId = "481510d9-3e2b-4582-a356-ffb8bca58b71"   # id of the virtual machine in Entra ID

# Assign the "Cosmos DB Built-in Data Reader" role to an identity
$parameters = @{
    ResourceGroupName = $ResourceGroupName
    AccountName = $AccountName
    RoleDefinitionId = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.DocumentDB/databaseAccounts/$AccountName/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001"
    PrincipalId = $PrincipalId
    Scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.DocumentDB/databaseAccounts/$AccountName"
}    
New-AzCosmosDBSqlRoleAssignment @parameters

# Assign the "Cosmos DB Built-in Data Contributor" role to an identity
$parameters = @{
    ResourceGroupName = $ResourceGroupName
    AccountName = $AccountName
    RoleDefinitionId = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.DocumentDB/databaseAccounts/$AccountName/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
    PrincipalId = $PrincipalId
    Scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.DocumentDB/databaseAccounts/$AccountName"
}    
New-AzCosmosDBSqlRoleAssignment @parameters