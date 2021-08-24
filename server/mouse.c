/**
 * Moves the cursor by the given input.
 *
 * 100,50 -> moves the cursor right by 100, up by 50
 * dl     -> clicks the left mouse button
 * ul     -> releases the left mouse button
 * dr     -> clicks the right mouse button
 * ur     -> releases the right mouse button
 */

#include <ApplicationServices/ApplicationServices.h>
#include <unistd.h>

int main() {
  char *line = NULL;
  size_t size;

  CGEventRef current_mouse, operation;

  while (1) {
    if (getline(&line, &size, stdin) == -1) {
      printf("No line\n");
    } else {
      if (line[0] == 'd' || line[0] == 'u') {
        current_mouse = CGEventCreate(NULL);
        CGPoint cursor = CGEventGetLocation(current_mouse);
        CFRelease(current_mouse);

        operation = CGEventCreateMouseEvent(
            NULL,
            line[0] == 'd' ? kCGEventLeftMouseDown : kCGEventLeftMouseUp,
            CGPointMake((int) cursor.x, (int) cursor.y),
            line[1] == 'l' ? kCGMouseButtonLeft : kCGMouseButtonRight
        );
      } else {

        // Parse command
        char* comma = strchr(line, ',');
        int new_y = atoi(comma + 1);
        *comma = 0;
        int new_x = atoi(line);

        // Move cursor
        operation = CGEventCreateMouseEvent(
          NULL,
          kCGEventMouseMoved,
          CGPointMake(new_x, new_y),
          kCGMouseButtonLeft
        );

      }
      CGEventPost(kCGHIDEventTap, operation);
      CFRelease(operation);
    }
  }
  return 0;
}
