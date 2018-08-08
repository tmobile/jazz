<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AssignMessage async="false" continueOnError="false" enabled="true" name="${api.name}_AssignRoutingVariable">

    <!-- Target System name -->
    <AssignVariable>
        <Name>capi.target.route.system</Name>
        <Value>${targetService}</Value>
    </AssignVariable>

    <!-- Target Service name -->
    <AssignVariable>
        <Name>capi.target.route.service</Name>
        <Value>${targetService}</Value>
    </AssignVariable>

    <!-- Target  Action name -->    
    <AssignVariable>
        <Name>capi.target.route.operation</Name>
        <Value>${api.name}</Value>
    </AssignVariable>
	
    <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
    <AssignTo createNew="false" transport="http" type="request"/>
</AssignMessage>