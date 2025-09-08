<script setup>
const user = {
  name: "John Doe",
  username: "@johndoe",
  avatar: "https://i.pravatar.cc/100?img=3"
}
</script>

<template>
  <div class="flex items-center space-x-3">
    <!-- Avatar -->
    <UAvatar
      size="lg"
      src="https://i.pravatar.cc/100?img=3"
      alt="User Avatar"
    />

    <!-- Text -->
    <div>
      <UText>{{ user.name }}</UText>
      <UText color="gray" size="sm">{{ user.username }}</UText>
    </div>
  </div>
</template>
